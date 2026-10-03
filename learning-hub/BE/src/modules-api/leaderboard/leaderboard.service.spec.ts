import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LeaderboardService } from './leaderboard.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let mockContestModel: any;
  let mockSubmissionModel: any;

  const contestId = '507f1f77bcf86cd799439011';
  const startTime = new Date('2026-01-01T00:00:00.000Z');
  const endTime = new Date('2026-01-01T02:00:00.000Z'); // 120 minutes duration

  const baseContest = {
    _id: contestId,
    startTime,
    endTime,
    durationMinutes: 120,
    problems: [
      { slug: 'p1', title: 'Problem 1', type: 'coding', points: 100, order: 1 },
      { slug: 'p2', title: 'Problem 2', type: 'quiz', points: 100, order: 2 },
    ],
  };

  function setupContest(overrides: Partial<typeof baseContest> = {}) {
    mockContestModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ ...baseContest, ...overrides }),
    });
  }

  function setupSubmissions(docs: any[]) {
    // Mirrors the real Mongo query's filter (isLate:false, submittedAt <= cutoff) so tests
    // exercise the same selection logic the service relies on, not just its in-memory grouping.
    mockSubmissionModel.find.mockImplementation((filter: any) => ({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(
          docs.filter((d) => {
            if (filter.isLate === false && d.isLate !== false) return false;
            const cutoff = filter.submittedAt?.$lte;
            if (cutoff && d.submittedAt.getTime() > cutoff.getTime())
              return false;
            return true;
          }),
        ),
      }),
    }));
  }

  function minutesAfterStart(mins: number) {
    return new Date(startTime.getTime() + mins * 60_000);
  }

  beforeEach(async () => {
    mockContestModel = { findOne: jest.fn() };
    mockSubmissionModel = { find: jest.fn() };

    setupContest();
    setupSubmissions([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: getModelToken(Contest.name), useValue: mockContestModel },
        {
          provide: getModelToken(ContestSubmission.name),
          useValue: mockSubmissionModel,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    jest.useFakeTimers().setSystemTime(minutesAfterStart(30)); // "now" during the contest, well before freeze
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('ranks by totalScore desc, tie-broken by (timeMinutes + penaltyMinutes) asc', async () => {
    setupSubmissions([
      // Student A: solves p1 fully at t=10, no wrong attempts before -> time=10, penalty=0
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(10),
        isLate: false,
      },
      // Student B: also solves p1 fully but slower / with one prior wrong attempt
      {
        studentId: 'B',
        studentName: 'Bob',
        problemSlug: 'p1',
        score: 50,
        submittedAt: minutesAfterStart(5),
        isLate: false,
      },
      {
        studentId: 'B',
        studentName: 'Bob',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(15),
        isLate: false,
      },
    ]);

    const result = await service.computeLeaderboard(contestId);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].studentId).toBe('A'); // same score (100), less time+penalty
    expect(result.rows[0].rank).toBe(1);
    expect(result.rows[1].studentId).toBe('B');
    expect(result.rows[1].rank).toBe(2);
  });

  it('applies +20 minutes penalty per wrong attempt before the best (max-score) submission', async () => {
    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 40,
        submittedAt: minutesAfterStart(2),
        isLate: false,
      },
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 60,
        submittedAt: minutesAfterStart(4),
        isLate: false,
      },
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(6),
        isLate: false,
      },
    ]);

    const result = await service.computeLeaderboard(contestId);

    expect(result.rows[0].penaltyMinutes).toBe(40); // 2 prior non-max attempts * 20
    expect(result.rows[0].timeMinutes).toBe(6);
  });

  it('takes the max score per problem across resubmits, not the latest submission', async () => {
    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(5),
        isLate: false,
      },
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 30,
        submittedAt: minutesAfterStart(10),
        isLate: false,
      },
    ]);

    const result = await service.computeLeaderboard(contestId);

    expect(result.rows[0].totalScore).toBe(100);
    expect(result.rows[0].timeMinutes).toBe(5); // uses the best (max-score) submission's time, not the latest
  });

  it('excludes isLate:true submissions entirely from scoring', async () => {
    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(150),
        isLate: true,
      },
    ]);

    const result = await service.computeLeaderboard(contestId);

    expect(result.rows).toHaveLength(0);
  });

  it('freezes the ranking during the freeze window: a new submission after freezeAt does not change it', async () => {
    // duration 120min -> freezeMinutes = min(60, round(120*0.3)) = 36 -> freezeAt = endTime - 36min = t=84
    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(50),
        isLate: false,
      },
    ]);
    jest.setSystemTime(minutesAfterStart(90)); // ONGOING, past freezeAt (t=84)

    const before = await service.computeLeaderboard(contestId);
    expect(before.isFrozen).toBe(true);
    expect(before.rows[0].totalScore).toBe(100);

    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(50),
        isLate: false,
      },
      {
        studentId: 'B',
        studentName: 'Bob',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(85),
        isLate: false,
      },
    ]);

    const after = await service.computeLeaderboard(contestId);
    expect(after.isFrozen).toBe(true);
    expect(after.rows).toHaveLength(1); // Bob's post-freeze submission is still excluded from the public view
    expect(after.rows[0].studentId).toBe('A');
  });

  it('shows the full unfrozen leaderboard once the contest has ENDED', async () => {
    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(50),
        isLate: false,
      },
      {
        studentId: 'B',
        studentName: 'Bob',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(85),
        isLate: false,
      },
    ]);
    jest.setSystemTime(new Date(endTime.getTime() + 60_000)); // now past endTime -> ENDED

    const result = await service.computeLeaderboard(contestId);

    expect(result.computedStatus).toBe('ENDED');
    expect(result.isFrozen).toBe(false);
    expect(result.rows).toHaveLength(2);
  });

  it('is deterministic: recomputing from the same log twice yields identical results', async () => {
    setupSubmissions([
      {
        studentId: 'A',
        studentName: 'Alice',
        problemSlug: 'p1',
        score: 100,
        submittedAt: minutesAfterStart(10),
        isLate: false,
      },
      {
        studentId: 'B',
        studentName: 'Bob',
        problemSlug: 'p2',
        score: 80,
        submittedAt: minutesAfterStart(12),
        isLate: false,
      },
    ]);

    const first = await service.computeLeaderboard(contestId);
    const second = await service.computeLeaderboard(contestId);

    expect(second).toEqual(first);
  });
});
