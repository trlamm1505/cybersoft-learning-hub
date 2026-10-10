import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator, Order } from 'blockly/javascript';
import { ensureBlocklyEnv } from '../common/blocklyEnv';
import type { BirdToolbox } from './birdLevels';

/**
 * Khối Blockly của Bird. Dựa trên blockly-games/appengine/bird/src/blocks.js,
 * Copyright 2012 Google LLC, Apache-2.0. Thay đổi: thông báo tiếng Việt, khối "nếu" của bản gốc (sửa khối chuẩn
 * để bỏ nối trên/dưới) thành khối riêng `bird_if` để không ảnh hưởng game khác dùng khối chuẩn.
 */
const VARIABLES_HUE = 330;
const MOVEMENT_HUE = 290;

let registered = false;

export function registerBirdBlocks(): void {
  ensureBlocklyEnv();
  if (registered) return;
  registered = true;

  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'bird_noWorm',
      message0: 'chưa có sâu',
      output: 'Boolean',
      colour: VARIABLES_HUE,
      tooltip: 'Đúng khi chim chưa bắt được sâu.',
    },
    {
      type: 'bird_heading',
      message0: 'bay theo hướng %1',
      args0: [{ type: 'field_angle', name: 'ANGLE', value: 90 }],
      previousStatement: null,
      nextStatement: null,
      colour: MOVEMENT_HUE,
      tooltip: 'Bay theo góc đã chọn (0 là sang phải, 90 là lên trên).',
    },
    {
      type: 'bird_position',
      message0: '%1',
      args0: [{ type: 'field_dropdown', name: 'XY', options: [['x', 'X'], ['y', 'Y']] }],
      output: 'Number',
      colour: VARIABLES_HUE,
      tooltip: 'Toạ độ x hoặc y hiện tại của chim (0 đến 100).',
    },
    {
      type: 'bird_compare',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        { type: 'field_dropdown', name: 'OP', options: [['<', 'LT'], ['>', 'GT']] },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: '%{BKY_LOGIC_HUE}',
      tooltip: 'So sánh toạ độ của chim với một số.',
    },
    {
      type: 'bird_and',
      message0: '%1 %{BKY_LOGIC_OPERATION_AND} %2',
      args0: [
        { type: 'input_value', name: 'A', check: 'Boolean' },
        { type: 'input_value', name: 'B', check: 'Boolean' },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: '%{BKY_LOGIC_HUE}',
      tooltip: '%{BKY_LOGIC_OPERATION_TOOLTIP_AND}',
    },
    {
      type: 'bird_ifElse',
      message0: '%{BKY_CONTROLS_IF_MSG_IF} %1 %{BKY_CONTROLS_IF_MSG_THEN} %2 %{BKY_CONTROLS_IF_MSG_ELSE} %3',
      args0: [
        { type: 'input_value', name: 'CONDITION', check: 'Boolean' },
        { type: 'input_statement', name: 'DO' },
        { type: 'input_statement', name: 'ELSE' },
      ],
      colour: '%{BKY_LOGIC_HUE}',
      tooltip: '%{BKY_CONTROLS_IF_TOOLTIP_2}',
    },
    {
      // Khối "nếu" có bánh răng thêm nhánh, giống khối chuẩn nhưng không nối được lên/xuống.
      type: 'bird_if',
      message0: '%{BKY_CONTROLS_IF_MSG_IF} %1',
      args0: [{ type: 'input_value', name: 'IF0', check: 'Boolean' }],
      message1: '%{BKY_CONTROLS_IF_MSG_THEN} %1',
      args1: [{ type: 'input_statement', name: 'DO0' }],
      style: 'logic_blocks',
      suppressPrefixSuffix: true,
      mutator: 'controls_if_mutator',
      extensions: ['controls_if_tooltip'],
    },
  ]);

  const gen = javascriptGenerator;
  gen.forBlock['bird_noWorm'] = () => ['noWorm()', Order.FUNCTION_CALL];
  gen.forBlock['bird_heading'] = (b) => `heading(${Number(b.getFieldValue('ANGLE'))}, '${b.id}');\n`;
  gen.forBlock['bird_position'] = (b) => [`get${String(b.getFieldValue('XY')).charAt(0)}()`, Order.FUNCTION_CALL];
  gen.forBlock['bird_compare'] = (b, g) => {
    const op = b.getFieldValue('OP') === 'LT' ? '<' : '>';
    const a = g.valueToCode(b, 'A', Order.RELATIONAL) || '0';
    const c = g.valueToCode(b, 'B', Order.RELATIONAL) || '0';
    return [`${a} ${op} ${c}`, Order.RELATIONAL];
  };
  gen.forBlock['bird_and'] = (b, g) => {
    let a = g.valueToCode(b, 'A', Order.LOGICAL_AND);
    let c = g.valueToCode(b, 'B', Order.LOGICAL_AND);
    if (!a && !c) {
      a = 'false';
      c = 'false';
    } else {
      a ||= 'true';
      c ||= 'true';
    }
    return [`${a} && ${c}`, Order.LOGICAL_AND];
  };
  gen.forBlock['bird_ifElse'] = (b, g) => {
    const cond = g.valueToCode(b, 'CONDITION', Order.NONE) || 'false';
    return `if (${cond}) {\n${g.statementToCode(b, 'DO')}} else {\n${g.statementToCode(b, 'ELSE')}}\n`;
  };
  // Cùng tên ô nhập với khối "nếu" chuẩn (IF0, DO0, IF1, DO1..., ELSE) nên dùng lại bộ sinh mã của nó.
  gen.forBlock['bird_if'] = gen.forBlock['controls_if'];
}

type Item = Blockly.utils.toolbox.FlyoutItemInfo;

const position = (xy: 'X' | 'Y'): Item => ({
  kind: 'block',
  type: 'bird_compare',
  fields: { OP: 'LT' },
  inputs: {
    A: { block: { type: 'bird_position', fields: { XY: xy } } },
    B: { block: { type: 'math_number', fields: { NUM: 50 } } },
  },
});

export function buildBirdToolbox(spec: BirdToolbox): Blockly.utils.toolbox.ToolboxInfo {
  const contents: Item[] = [{ kind: 'block', type: 'bird_heading' }];
  if (spec.noWorm) contents.push({ kind: 'block', type: 'bird_noWorm' });
  if (spec.compare) contents.push(position('X'));
  if (spec.compare === 'xy') contents.push(position('Y'));
  if (spec.and) contents.push({ kind: 'block', type: 'bird_and' });
  return { kind: 'flyoutToolbox', contents };
}

export function generateBirdCode(workspace: Blockly.Workspace): string {
  javascriptGenerator.INFINITE_LOOP_TRAP = null;
  return javascriptGenerator.workspaceToCode(workspace);
}
