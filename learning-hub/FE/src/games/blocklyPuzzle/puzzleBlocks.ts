import * as Blockly from 'blockly/core';
import { ensureBlocklyEnv } from '../common/blocklyEnv';
import { ANIMALS, animalPicture, isBlockCorrect, legsOptions, type PuzzleBlock } from './puzzleData';

/**
 * Khối của Puzzle. Dựa trên blockly-games/appengine/puzzle/src/blocks.js,
 * Copyright 2012 Google LLC, Apache-2.0. Thay đổi: tiếng Việt, hình là SVG biểu tượng.
 */
const ANIMAL_HUE = 120;
const PICTURE_HUE = 30;
const TRAIT_HUE = 290;

/** Các khối này có thêm thuộc tính riêng nên dùng kiểu lỏng khi gắn thêm hàm. */
type PuzzleBlockInstance = Blockly.Block & {
  animal: number;
  trait?: number;
  populate: (n: number, m?: number) => void;
  toModel: () => PuzzleBlock;
};

let registered = false;

export function registerPuzzleBlocks(): void {
  ensureBlocklyEnv();
  if (registered) return;
  registered = true;

  const blocks = Blockly.Blocks as Record<string, unknown>;

  blocks['animal'] = {
    animal: 0,
    init(this: Blockly.Block) {
      this.setColour(ANIMAL_HUE);
      this.appendDummyInput().appendField('', 'NAME');
      this.appendValueInput('PIC').setAlign(Blockly.inputs.Align.RIGHT).appendField('hình:');
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.RIGHT)
        .appendField('số chân:')
        .appendField(new Blockly.FieldDropdown(legsOptions), 'LEGS');
      this.appendStatementInput('TRAITS').appendField('đặc điểm:');
      this.setInputsInline(false);
    },
    populate(this: PuzzleBlockInstance, n: number) {
      this.animal = n;
      this.setFieldValue(ANIMALS[n - 1].name, 'NAME');
      this.setHelpUrl(ANIMALS[n - 1].helpUrl);
    },
    toModel(this: PuzzleBlockInstance): PuzzleBlock {
      return { kind: 'animal', animal: this.animal, legs: Number(this.getFieldValue('LEGS')) };
    },
  };

  blocks['picture'] = {
    animal: 0,
    init(this: Blockly.Block) {
      this.setColour(PICTURE_HUE);
      this.appendDummyInput('PIC');
      this.setOutput(true);
      this.setTooltip('');
    },
    populate(this: PuzzleBlockInstance, n: number) {
      this.animal = n;
      this.getInput('PIC')!.appendField(new Blockly.FieldImage(animalPicture(n), 100, 70, ANIMALS[n - 1].name));
    },
    toModel(this: PuzzleBlockInstance): PuzzleBlock {
      const parent = this.getParent() as PuzzleBlockInstance | null;
      return { kind: 'picture', animal: this.animal, parentAnimal: parent?.type === 'animal' ? parent.animal : null };
    },
  };

  blocks['trait'] = {
    animal: 0,
    trait: 0,
    init(this: Blockly.Block) {
      this.setColour(TRAIT_HUE);
      this.appendDummyInput().appendField('', 'NAME');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
    },
    populate(this: PuzzleBlockInstance, n: number, m = 1) {
      this.animal = n;
      this.trait = m;
      this.setFieldValue(ANIMALS[n - 1].traits[m - 1], 'NAME');
    },
    toModel(this: PuzzleBlockInstance): PuzzleBlock {
      // Đặc điểm có thể nằm sâu trong chuỗi: lấy khối "animal" bao ngoài gần nhất.
      const surround = this.getSurroundParent() as PuzzleBlockInstance | null;
      return { kind: 'trait', animal: this.animal, parentAnimal: surround?.type === 'animal' ? surround.animal : null };
    },
  };
}

export const modelOf = (b: Blockly.Block): PuzzleBlock => (b as PuzzleBlockInstance).toModel();
export const isCorrectBlock = (b: Blockly.Block): boolean => isBlockCorrect(modelOf(b));
export const populate = (b: Blockly.Block, n: number, m?: number): void => (b as PuzzleBlockInstance).populate(n, m);
