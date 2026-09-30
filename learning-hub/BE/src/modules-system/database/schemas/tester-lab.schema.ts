import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TesterLabDocument = TesterLab & Document;

export type TesterLabCategory =
  | 'BUG_REPORT'
  | 'TEST_CASE_DESIGN'
  | 'API_TESTING';

export type ArtifactFileType = 'csv' | 'xlsx' | 'json' | 'pdf';

/** severity: chấm phân loại/kết quả; quality: chấm trình bày, tái hiện, bao phủ. */
export type RubricKind = 'severity' | 'quality';

export interface RubricCriterion {
  key: string;
  label: string;
  maxScore: number;
  kind: RubricKind;
}

@Schema({ timestamps: true, collection: 'tester_labs' })
export class TesterLab {
  @Prop({ required: true, unique: true, type: String })
  labCode: string;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({
    required: true,
    type: String,
    enum: ['BUG_REPORT', 'TEST_CASE_DESIGN', 'API_TESTING'],
    index: true,
  })
  category: TesterLabCategory;

  @Prop({ type: String, default: '' })
  environmentUrl: string;

  /** Tên file trong assets/tester-labs/fixtures. */
  @Prop({ type: [String], default: [] })
  fixtureUrls: string[];

  /** Tên file trong assets/tester-labs/templates. */
  @Prop({ type: String, default: '' })
  templateArtifact: string;

  @Prop({ type: [String], default: ['csv', 'xlsx', 'pdf'] })
  allowedFileTypes: ArtifactFileType[];

  /** Cột (CSV) hoặc khóa gốc (JSON) bắt buộc phải có trong bài nộp. */
  @Prop({ type: [String], default: [] })
  requiredColumns: string[];

  @Prop({
    type: [
      {
        _id: false,
        key: String,
        label: String,
        maxScore: Number,
        kind: { type: String, enum: ['severity', 'quality'] },
      },
    ],
    default: [],
  })
  rubricCriteria: RubricCriterion[];
}

export const TesterLabSchema = SchemaFactory.createForClass(TesterLab);
