import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import QuestionCard from './QuestionCard';
import { QuizResultView } from './QuizResultView';
import { CoachPanel } from './CoachPanel';
import { QuizQuestionForm } from './teacher/QuizQuestionForm';
import { answerStatus, countAnswerStatuses, optionLabel } from '../common/quizOptions';
import { addOption, emptyQuizForm, quizPayload, removeOption, validateQuizForm } from '../pages/quizBankModel';
import { TEACHER_BANDS, teacherBandOf } from '../common/exerciseMatrix';

/** Day 30 — Bước 2–4: Teacher Studio, soạn trắc nghiệm, giao diện Quiz và accessibility. */
const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('TC_UI_02: nhãn đáp án luôn là A, B, C, D theo vị trí', () => {
  it('optionLabel theo chỉ số', () => {
    expect([0, 1, 2, 3, 5].map(optionLabel)).toEqual(['A', 'B', 'C', 'D', 'F']);
  });

  it('QuestionCard: đáp án đã xáo (key gốc C, A, D, B) vẫn hiện A, B, C, D và có tên truy cập', () => {
    const html = renderToString(
      <QuestionCard
        question={{ questionId: 'q1', content: 'Câu?', options: [{ key: 'C', text: 'ba' }, { key: 'A', text: 'một' }, { key: 'D', text: 'bốn' }, { key: 'B', text: 'hai' }] } as never}
        questionNumber={1}
        totalQuestions={1}
        selectedOptionKey="A"
        onSelectOption={() => undefined}
        onPrev={() => undefined}
        onNext={() => undefined}
        isFirst
        isLast
      />,
    );
    expect(html).toContain('aria-label="Đáp án A: ba"');
    expect(html).toContain('aria-label="Đáp án B: một"');
    expect(html).toContain('aria-pressed="true"');
  });
});

describe('DEF-061: trang kết quả tách câu Bỏ trống khỏi câu Sai', () => {
  const questions = [
    { questionId: '1', isCorrect: true, selectedOptionKey: 'A' },
    { questionId: '2', isCorrect: false, selectedOptionKey: 'B' },
    { questionId: '3', isCorrect: false, selectedOptionKey: '' },
    { questionId: '4', isCorrect: false },
  ];

  it('answerStatus / countAnswerStatuses', () => {
    expect(questions.map(answerStatus)).toEqual(['correct', 'wrong', 'blank', 'blank']);
    expect(countAnswerStatuses(questions)).toEqual({ correct: 1, wrong: 1, blank: 2 });
  });

  it('QuizResultView hiển thị nhãn "Bỏ trống" và bộ đếm riêng', () => {
    const reviewData = {
      score: 10,
      maxScore: 40,
      status: 'GRADED',
      questions: questions.map((q) => ({ ...q, content: `Câu ${q.questionId}`, explanation: '', options: [{ key: 'C', text: 'x', isCorrect: true }, { key: 'A', text: 'y', isCorrect: false }] })),
    };
    const out = text(renderToString(<QuizResultView reviewData={reviewData as never} onRetakeQuiz={() => undefined} />));
    expect(out).toContain('Bỏ trống (0 điểm)');
    expect(out).toContain('Sai 1 · Bỏ trống 2');
    expect(out).toContain('A. x');
  });
});

describe('DEF-008: ô chat AI Coach có tên truy cập', () => {
  it('textarea và nút gửi có aria-label', () => {
    const html = renderToString(<CoachPanel exerciseSlug="a" userId="u1" />);
    expect(html).toContain('aria-label="Câu hỏi cho AI Coach"');
    expect(html).toContain('aria-label="Gửi câu hỏi cho AI Coach"');
  });
});

describe('Soạn câu hỏi trắc nghiệm (Khối 6–9 / 10–12)', () => {
  it('Teacher Studio chỉ có 2 khối, nhóm/lab suy ra từ khối', () => {
    expect(TEACHER_BANDS.map((b) => b.band)).toEqual(['6-9', '10-12']);
    expect(teacherBandOf('K10_12')).toBe('10-12');
    expect(teacherBandOf('K3_5')).toBeNull();
    expect(teacherBandOf('CAREER_ADULT')).toBeNull();
  });

  it('validateQuizForm bắt lỗi giống máy chủ; quizPayload đánh dấu đúng một đáp án đúng', () => {
    const f = { ...emptyQuizForm('10-12'), content: 'Q?', explanation: 'vì', options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }], correctIndex: 2 };
    expect(validateQuizForm(f)).toBeNull();
    expect(quizPayload(f).options.map((o) => o.isCorrect)).toEqual([false, false, true]);
    expect(quizPayload(f).band).toBe('10-12');
    expect(validateQuizForm({ ...f, options: [{ text: 'a' }, { text: 'A ' }] })).toMatch(/trùng/);
    expect(validateQuizForm({ ...f, options: [{ text: 'a' }, { text: '' }] })).toMatch(/Đáp án B đang trống/);
    expect(validateQuizForm({ ...f, explanation: '' })).toMatch(/giải thích/);
  });

  it('thêm/bớt đáp án giữ đúng vị trí đáp án đúng, trong giới hạn 2–6', () => {
    const f = { ...emptyQuizForm(), correctIndex: 2 };
    expect(removeOption(f, 0).correctIndex).toBe(1);
    expect(removeOption(f, 2).correctIndex).toBe(0);
    const two = { ...f, options: [{ text: 'a' }, { text: 'b' }], correctIndex: 0 };
    expect(removeOption(two, 1)).toBe(two);
    let six = f;
    for (let i = 0; i < 5; i++) six = addOption(six);
    expect(six.options).toHaveLength(6);
  });

  it('form có nhãn cho mọi ô và radio chọn đáp án đúng', () => {
    const html = renderToString(<QuizQuestionForm initial={emptyQuizForm()} submitLabel="Lưu" onSubmit={() => undefined} />);
    for (const id of ['qz-band', 'qz-diff', 'qz-points', 'qz-content', 'qz-code', 'qz-explain']) expect(html).toContain(`for="${id}"`);
    expect(html).toContain('aria-label="Đáp án A là đáp án đúng"');
    expect(html).toContain('aria-label="Nội dung đáp án D"');
    expect(html).not.toMatch(/3-5|CAREER/);
  });
});
