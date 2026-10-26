import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator, Order } from 'blockly/javascript';
import { ensureBlocklyEnv } from '../common/blocklyEnv';
import type { TurtleToolbox } from './turtleLevels';

/**
 * Khối Blockly của Turtle. Dựa trên blockly-games/appengine/turtle/src/blocks.js,
 * Copyright 2012 Google LLC, Apache-2.0. Thay đổi: thông báo tiếng Việt, dùng Blockly từ npm, sinh mã không
 * dùng JS-Interpreter (xem turtleEngine.runTurtleProgram).
 */
const HUE = 160;
const LEFT = ' ↺';
const RIGHT = ' ↻';
/** Bảng màu rút gọn cho màn 3-9 (3 cột, như bản gốc). */
export const PALETTE = ['#ff0000', '#ffcc33', '#ffff00', '#009900', '#3333ff', '#cc33cc', '#ffffff', '#999999', '#000000'];

let registered = false;

export function registerTurtleBlocks(): void {
  ensureBlocklyEnv();
  if (registered) return;
  registered = true;

  const moveOptions: Array<[string, string]> = [
    ['tiến', 'moveForward'],
    ['lùi', 'moveBackward'],
  ];
  const turnOptions: Array<[string, string]> = [
    ['rẽ phải' + RIGHT, 'turnRight'],
    ['rẽ trái' + LEFT, 'turnLeft'],
  ];

  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'turtle_move',
      message0: '%1 %2',
      args0: [
        { type: 'field_dropdown', name: 'DIR', options: moveOptions },
        { type: 'input_value', name: 'VALUE', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Di chuyển rùa tiến hoặc lùi theo số bước đã cho.',
    },
    {
      type: 'turtle_move_internal',
      message0: '%1 %2',
      args0: [
        { type: 'field_dropdown', name: 'DIR', options: moveOptions },
        {
          type: 'field_dropdown',
          name: 'VALUE',
          options: [['20', '20'], ['50', '50'], ['100', '100'], ['150', '150']],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Di chuyển rùa tiến hoặc lùi theo số bước đã chọn.',
    },
    {
      type: 'turtle_turn',
      message0: '%1 %2',
      args0: [
        { type: 'field_dropdown', name: 'DIR', options: turnOptions },
        { type: 'input_value', name: 'VALUE', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Quay rùa sang phải hoặc trái theo số độ đã cho.',
    },
    {
      type: 'turtle_turn_internal',
      message0: '%1 %2',
      args0: [
        { type: 'field_dropdown', name: 'DIR', options: turnOptions },
        {
          type: 'field_dropdown',
          name: 'VALUE',
          options: [['1°', '1'], ['45°', '45'], ['72°', '72'], ['90°', '90'], ['120°', '120'], ['144°', '144']],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Quay rùa sang phải hoặc trái theo số độ đã chọn.',
    },
    {
      type: 'turtle_width',
      message0: 'đặt độ rộng nét bút %1',
      args0: [{ type: 'input_value', name: 'WIDTH', check: 'Number' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Đổi độ rộng nét bút.',
    },
    {
      type: 'turtle_pen',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'PEN',
          options: [['nhấc bút', 'penUp'], ['hạ bút', 'penDown']],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Nhấc bút để di chuyển không vẽ, hạ bút để vẽ tiếp.',
    },
    {
      type: 'turtle_colour',
      message0: 'đặt màu bút %1',
      args0: [{ type: 'input_value', name: 'COLOUR', check: 'Colour' }],
      previousStatement: null,
      nextStatement: null,
      colour: '%{BKY_COLOUR_HUE}',
      tooltip: 'Đổi màu bút.',
    },
    {
      type: 'turtle_colour_internal',
      message0: 'đặt màu bút %1',
      args0: [
        {
          type: 'field_colour',
          name: 'COLOUR',
          colour: '#ff0000',
          colourOptions: PALETTE,
          colourTitles: PALETTE,
          columns: 3,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '%{BKY_COLOUR_HUE}',
      tooltip: 'Đổi màu bút.',
    },
    {
      type: 'turtle_visibility',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'VISIBILITY',
          options: [['ẩn rùa', 'hideTurtle'], ['hiện rùa', 'showTurtle']],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Ẩn hoặc hiện con rùa (nét vẽ vẫn giữ nguyên).',
    },
    {
      type: 'turtle_print',
      message0: 'viết %1',
      args0: [{ type: 'input_value', name: 'TEXT' }],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Viết chữ tại vị trí của rùa.',
    },
    {
      type: 'turtle_font',
      message0: 'phông chữ %1 %2 cỡ %3 %4 %5',
      args0: [
        {
          type: 'field_dropdown',
          name: 'FONT',
          options: [
            ['Arial', 'Arial'],
            ['Courier New', 'Courier New'],
            ['Georgia', 'Georgia'],
            ['Impact', 'Impact'],
            ['Times New Roman', 'Times New Roman'],
            ['Trebuchet MS', 'Trebuchet MS'],
            ['Verdana', 'Verdana'],
          ],
        },
        { type: 'input_dummy' },
        { type: 'field_number', name: 'FONTSIZE', value: 18, min: 1, max: 1000 },
        { type: 'input_dummy' },
        {
          type: 'field_dropdown',
          name: 'FONTSTYLE',
          options: [['thường', 'normal'], ['nghiêng', 'italic'], ['đậm', 'bold']],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: HUE,
      tooltip: 'Chọn phông chữ, cỡ và kiểu cho khối «viết».',
    },
    {
      type: 'turtle_repeat_internal',
      message0: '%{BKY_CONTROLS_REPEAT_TITLE} %2 %{BKY_CONTROLS_REPEAT_INPUT_DO} %3',
      args0: [
        {
          type: 'field_dropdown',
          name: 'TIMES',
          options: [['3', '3'], ['4', '4'], ['5', '5'], ['360', '360']],
        },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '%{BKY_LOOPS_HUE}',
      tooltip: '%{BKY_CONTROLS_REPEAT_TOOLTIP}',
    },
  ]);

  const gen = javascriptGenerator;
  const id = (b: Blockly.Block) => `'${b.id}'`;
  const value = (b: Blockly.Block, name: string, fallback: string) =>
    gen.valueToCode(b, name, Order.COMMA) || fallback;

  gen.forBlock['turtle_move'] = (b) => `${b.getFieldValue('DIR')}(${value(b, 'VALUE', '0')}, ${id(b)});\n`;
  gen.forBlock['turtle_move_internal'] = (b) => `${b.getFieldValue('DIR')}(${Number(b.getFieldValue('VALUE'))}, ${id(b)});\n`;
  gen.forBlock['turtle_turn'] = (b) => `${b.getFieldValue('DIR')}(${value(b, 'VALUE', '0')}, ${id(b)});\n`;
  gen.forBlock['turtle_turn_internal'] = (b) => `${b.getFieldValue('DIR')}(${Number(b.getFieldValue('VALUE'))}, ${id(b)});\n`;
  gen.forBlock['turtle_width'] = (b) => `penWidth(${value(b, 'WIDTH', '1')}, ${id(b)});\n`;
  gen.forBlock['turtle_pen'] = (b) => `${b.getFieldValue('PEN')}(${id(b)});\n`;
  gen.forBlock['turtle_colour'] = (b) => `penColour(${value(b, 'COLOUR', "'#000000'")}, ${id(b)});\n`;
  gen.forBlock['turtle_colour_internal'] = (b) => `penColour(${gen.quote_(String(b.getFieldValue('COLOUR')))}, ${id(b)});\n`;
  gen.forBlock['turtle_visibility'] = (b) => `${b.getFieldValue('VISIBILITY')}(${id(b)});\n`;
  gen.forBlock['turtle_print'] = (b) => `print(${value(b, 'TEXT', "''")}, ${id(b)});\n`;
  gen.forBlock['turtle_font'] = (b) =>
    `font(${gen.quote_(String(b.getFieldValue('FONT')))}, ${Number(b.getFieldValue('FONTSIZE'))}, ${gen.quote_(String(b.getFieldValue('FONTSTYLE')))}, ${id(b)});\n`;
  gen.forBlock['turtle_repeat_internal'] = gen.forBlock['controls_repeat'];
}

type Flyout = Blockly.utils.toolbox.FlyoutItemInfo[];
type Num = (n: number) => { shadow: { type: string; fields: { NUM: number } } };
const num: Num = (n) => ({ shadow: { type: 'math_number', fields: { NUM: n } } });

/** Hộp công cụ đầy đủ của màn 10 (bản gốc có thêm Danh sách, ở đây bỏ cho gọn). */
function fullToolbox(): Blockly.utils.toolbox.ToolboxInfo {
  const colourShadow = (c: string) => ({ shadow: { type: 'colour_picker', fields: { COLOUR: c } } });
  const cat = (name: string, colour: string, contents: Flyout) => ({ kind: 'category', name, colour, contents });
  return {
    kind: 'categoryToolbox',
    contents: [
      cat('Rùa', '160', [
        { kind: 'block', type: 'turtle_move', inputs: { VALUE: num(10) } },
        { kind: 'block', type: 'turtle_turn', inputs: { VALUE: num(90) } },
        { kind: 'block', type: 'turtle_width', inputs: { WIDTH: num(1) } },
        { kind: 'block', type: 'turtle_pen' },
        { kind: 'block', type: 'turtle_visibility' },
        { kind: 'block', type: 'turtle_print', inputs: { TEXT: { shadow: { type: 'text' } } } },
        { kind: 'block', type: 'turtle_font' },
      ]),
      cat('Màu', '20', [
        { kind: 'block', type: 'turtle_colour', inputs: { COLOUR: { shadow: { type: 'colour_picker' } } } },
        { kind: 'block', type: 'colour_picker' },
        { kind: 'block', type: 'colour_random' },
        {
          kind: 'block',
          type: 'colour_rgb',
          inputs: { RED: num(100), GREEN: num(50), BLUE: num(0) },
        },
        {
          kind: 'block',
          type: 'colour_blend',
          inputs: { COLOUR1: colourShadow('#ff0000'), COLOUR2: colourShadow('#3333ff'), RATIO: num(0.5) },
        },
      ]),
      cat('Logic', '210', [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
        { kind: 'block', type: 'logic_ternary' },
      ]),
      cat('Vòng lặp', '120', [
        { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: num(10) } },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for', inputs: { FROM: num(1), TO: num(10), BY: num(1) } },
        { kind: 'block', type: 'controls_flow_statements' },
      ]),
      cat('Toán', '230', [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic', inputs: { A: num(1), B: num(1) } },
        { kind: 'block', type: 'math_single', inputs: { NUM: num(9) } },
        { kind: 'block', type: 'math_trig', inputs: { NUM: num(45) } },
        { kind: 'block', type: 'math_constant' },
        { kind: 'block', type: 'math_number_property', inputs: { NUMBER_TO_CHECK: num(0) } },
        { kind: 'block', type: 'math_round', inputs: { NUM: num(3.1) } },
        { kind: 'block', type: 'math_modulo', inputs: { DIVIDEND: num(64), DIVISOR: num(10) } },
        { kind: 'block', type: 'math_random_int', inputs: { FROM: num(1), TO: num(100) } },
        { kind: 'block', type: 'math_random_float' },
      ]),
      { kind: 'sep' },
      { kind: 'category', name: 'Biến', colour: '330', custom: 'VARIABLE' },
      { kind: 'category', name: 'Hàm', colour: '290', custom: 'PROCEDURE' },
    ],
  } as Blockly.utils.toolbox.ToolboxInfo;
}

/** Hộp công cụ theo màn: màn 1-9 dùng khối đơn giản có sẵn giá trị chọn từ danh sách. */
export function buildTurtleToolbox(spec: TurtleToolbox): Blockly.utils.toolbox.ToolboxInfo {
  if (spec.full) return fullToolbox();
  const turtle: Flyout = [
    { kind: 'block', type: 'turtle_move_internal', fields: { VALUE: '100' } },
    { kind: 'block', type: 'turtle_turn_internal', fields: { VALUE: '90' } },
  ];
  if (spec.pen) turtle.push({ kind: 'block', type: 'turtle_pen' });
  const contents: Blockly.utils.toolbox.ToolboxItemInfo[] = [
    { kind: 'category', name: 'Rùa', colour: '160', contents: turtle } as Blockly.utils.toolbox.CategoryInfo,
  ];
  if (spec.colour) {
    contents.push({ kind: 'category', name: 'Màu', colour: '20', contents: [{ kind: 'block', type: 'turtle_colour_internal' }] } as Blockly.utils.toolbox.CategoryInfo);
  }
  contents.push({
    kind: 'category',
    name: 'Vòng lặp',
    colour: '120',
    contents: [{ kind: 'block' as const, type: 'turtle_repeat_internal', fields: { TIMES: '4' } }],
  } as unknown as Blockly.utils.toolbox.CategoryInfo);
  return { kind: 'categoryToolbox', contents };
}

export function generateTurtleCode(workspace: Blockly.Workspace): string {
  // Mỗi vòng lặp chuẩn gọi tick() để dừng chương trình chạy mãi (xem turtleEngine.MAX_TICKS).
  javascriptGenerator.INFINITE_LOOP_TRAP = 'tick();\n';
  const code = javascriptGenerator.workspaceToCode(workspace);
  javascriptGenerator.INFINITE_LOOP_TRAP = null;
  return code;
}
