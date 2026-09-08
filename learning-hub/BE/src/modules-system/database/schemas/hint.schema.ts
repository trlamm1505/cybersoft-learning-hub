import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HintDocument = Hint & Document;

/**
 * Validator function ensuring Tier 1 (Concept) never contains complete code syntax or code blocks.
 */
export function validateTier1NoCode(content: string, level: number): boolean {
  if (level !== 1) return true;

  // Check for markdown code blocks (```)
  if (/```[\s\S]*?```/.test(content)) return false;

  // Check for common programming code syntax patterns
  const codePatterns = [
    /\bdef\s+\w+\s*\(/i,
    /\bfunction\s+\w+\s*\(/i,
    /\bclass\s+\w+/i,
    /\bimport\s+[\w\{\}\*]+/i,
    /\breturn\s+[^;\n]+/i,
    /\bconsole\.log\s*\(/i,
    /\bprint\s*\(/i,
    /\b(for|while)\s*\([^)]*\)\s*\{/i,
    /\b(if|else if)\s*\([^)]*\)\s*\{/i,
    /[a-zA-Z0-9_]+\s*=\s*[a-zA-Z0-9_]+\s*[\+\-\*\/]/, // Assignment with arithmetic expressions e.g. a = b + c
  ];

  for (const pattern of codePatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
}

@Schema({ timestamps: true, collection: 'hints' })
export class Hint {
  @Prop({ required: true, type: String, index: true })
  exerciseSlug: string;

  @Prop({ required: true, type: Number, enum: [1, 2, 3] })
  level: number;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({
    required: true,
    type: String,
    validate: {
      validator: function (this: any, v: string) {
        const level = this.level ?? (this.get ? this.get('level') : undefined);
        return validateTier1NoCode(v, level);
      },
      message: 'Hint Tầng 1 (Khái niệm) tuyệt đối không được chứa code hoàn chỉnh hoặc cú pháp lập trình!',
    },
  })
  content: string;

  @Prop({ type: Number, default: 5 })
  costPoints: number;

  @Prop({ type: Number, default: 30 })
  cooldownSeconds: number;
}

export const HintSchema = SchemaFactory.createForClass(Hint);

// Index compound key exerciseSlug + level for uniqueness and quick lookup
HintSchema.index({ exerciseSlug: 1, level: 1 }, { unique: true });

// Pre-save hook validation
HintSchema.pre('save', function () {
  if (this.level === 1 && !validateTier1NoCode(this.content, 1)) {
    throw new Error('Hint Tầng 1 (Khái niệm) tuyệt đối không được chứa code hoàn chỉnh hoặc cú pháp lập trình!');
  }
});
