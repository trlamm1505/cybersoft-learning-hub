import * as Blockly from 'blockly/core';
import * as ViMessages from 'blockly/msg/vi';
import { javascriptGenerator } from 'blockly/javascript';
import { installAllBlocks, registerFieldColour } from '@blockly/field-colour';
import { registerFieldAngle } from '@blockly/field-angle';

let ready = false;

/**
 * Đặt ngôn ngữ tiếng Việt cho Blockly một lần cho mọi trò chơi, đăng ký ô chọn màu/góc và các khối màu
 * (từ Blockly 12 chúng tách thành plugin chính thức @blockly/field-colour và @blockly/field-angle).
 */
export function ensureBlocklyEnv(): void {
  if (ready) return;
  ready = true;
  Blockly.setLocale(ViMessages as unknown as { [key: string]: string });
  registerFieldColour();
  registerFieldAngle();
  installAllBlocks({ javascript: javascriptGenerator });
}
