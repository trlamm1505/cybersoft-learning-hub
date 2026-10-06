import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import * as ViMessages from 'blockly/msg/vi';
import type { ToolboxSpec } from './mazeLevels';

/**
 * Khối Blockly của Maze. Dựa trên blockly-games/appengine/maze/src/blocks.js,
 * Copyright 2012 Google LLC, Apache-2.0. Thay đổi: thông báo tiếng Việt, dùng thư viện Blockly từ npm,
 * hàm sinh mã không dùng JS-Interpreter (xem mazeEngine.runProgram).
 */
const MOVEMENT_HUE = 290;
const LOOPS_HUE = 120;
const LOGIC_HUE = 210;
const LEFT_TURN = ' ↺';
const RIGHT_TURN = ' ↻';
export const MARKER_URL = '/games/blockly-maze/marker.png';

let registered = false;

/** Đăng ký khối và bộ sinh mã một lần (module nạp lại khi dev vẫn an toàn). */
export function registerMazeBlocks(): void {
  if (registered) return;
  registered = true;

  Blockly.setLocale(ViMessages as unknown as { [key: string]: string });

  const turnOptions: Array<[string, string]> = [
    ['rẽ trái' + LEFT_TURN, 'turnLeft'],
    ['rẽ phải' + RIGHT_TURN, 'turnRight'],
  ];
  const pathOptions: Array<[string, string]> = [
    ['nếu có đường phía trước', 'isPathForward'],
    ['nếu có đường bên trái ' + LEFT_TURN.trim(), 'isPathLeft'],
    ['nếu có đường bên phải ' + RIGHT_TURN.trim(), 'isPathRight'],
  ];

  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'maze_moveForward',
      message0: 'tiến lên',
      previousStatement: null,
      nextStatement: null,
      colour: MOVEMENT_HUE,
      tooltip: 'Đi thẳng về phía trước một ô.',
    },
    {
      type: 'maze_turn',
      message0: '%1',
      args0: [{ type: 'field_dropdown', name: 'DIR', options: turnOptions }],
      previousStatement: null,
      nextStatement: null,
      colour: MOVEMENT_HUE,
      tooltip: 'Quay sang trái hoặc phải 90 độ.',
    },
    {
      type: 'maze_if',
      message0: '%1 %2 thực hiện %3',
      args0: [
        { type: 'field_dropdown', name: 'DIR', options: pathOptions },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: LOGIC_HUE,
      tooltip: 'Nếu có đường theo hướng đã chọn thì thực hiện các khối bên trong.',
    },
    {
      type: 'maze_ifElse',
      message0: '%1 %2 thực hiện %3 nếu không %4',
      args0: [
        { type: 'field_dropdown', name: 'DIR', options: pathOptions },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
        { type: 'input_statement', name: 'ELSE' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: LOGIC_HUE,
      tooltip: 'Nếu có đường theo hướng đã chọn thì làm nhánh đầu, nếu không thì làm nhánh sau.',
    },
    {
      type: 'maze_forever',
      message0: 'lặp lại cho đến khi tới đích %1 %2 thực hiện %3',
      args0: [
        { type: 'field_image', src: MARKER_URL, width: 12, height: 16, alt: 'đích' },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      previousStatement: null,
      colour: LOOPS_HUE,
      tooltip: 'Lặp lại các khối bên trong cho tới khi nhân vật tới đích.',
    },
  ]);

  const gen = javascriptGenerator;
  gen.forBlock['maze_moveForward'] = (block) => `moveForward('${block.id}');\n`;
  gen.forBlock['maze_turn'] = (block) => `${block.getFieldValue('DIR')}('${block.id}');\n`;
  gen.forBlock['maze_if'] = (block, g) => {
    const cond = `${block.getFieldValue('DIR')}('${block.id}')`;
    return `if (${cond}) {\n${g.statementToCode(block, 'DO')}}\n`;
  };
  gen.forBlock['maze_ifElse'] = (block, g) => {
    const cond = `${block.getFieldValue('DIR')}('${block.id}')`;
    return `if (${cond}) {\n${g.statementToCode(block, 'DO')}} else {\n${g.statementToCode(block, 'ELSE')}}\n`;
  };
  gen.forBlock['maze_forever'] = (block, g) => {
    const branch = g.statementToCode(block, 'DO');
    // Mỗi vòng lặp gọi tick() để dừng chương trình chạy mãi (xem mazeEngine.MAX_TICKS).
    return `while (notDone()) {\ntick();\n${branch}}\n`;
  };
}

/** Hộp công cụ theo màn (cùng quy tắc với Blockly Games). */
export function buildToolbox(spec: ToolboxSpec): Blockly.utils.toolbox.ToolboxInfo {
  const contents: Blockly.utils.toolbox.FlyoutItemInfo[] = [
    { kind: 'block', type: 'maze_moveForward' },
    { kind: 'block', type: 'maze_turn', fields: { DIR: 'turnLeft' } },
    { kind: 'block', type: 'maze_turn', fields: { DIR: 'turnRight' } },
  ];
  if (spec.forever) contents.push({ kind: 'block', type: 'maze_forever' });
  if (spec.ifBlock !== 'none') {
    contents.push({
      kind: 'block',
      type: 'maze_if',
      fields: { DIR: spec.ifBlock === 'left' ? 'isPathLeft' : 'isPathForward' },
    });
  }
  if (spec.ifElse) contents.push({ kind: 'block', type: 'maze_ifElse' });
  return { kind: 'flyoutToolbox', contents };
}

/** Mã JavaScript từ các khối trên workspace. */
export function generateCode(workspace: Blockly.Workspace): string {
  return javascriptGenerator.workspaceToCode(workspace);
}
