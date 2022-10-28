import {
  EditorState,
  EditorSelection,
  SelectionRange,
} from "@codemirror/state";
import { EditorView, KeyBinding } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode } from "@lezer/common";

const triggerMenuOpen = (triggerSelectionCheck: any) => (view: EditorView) => {
  triggerSelectionCheck(view);
  return true;
};
const closeMenu = (triggerSelectionCheck: any) => (view: EditorView) => {
  triggerSelectionCheck(false);
  return true;
};

export const MenuTriggerKeyBinding = (
  triggerSelectionCheck: any
): readonly KeyBinding[] => [
  {
    key: "Cmd-ArrowDown",
    run: triggerMenuOpen(triggerSelectionCheck),
    preventDefault: true,
  },
  {
    key: "Cmd-.",
    run: triggerMenuOpen(triggerSelectionCheck),
    preventDefault: true,
  },
  {
    key: "Cmd-ArrowUp",
    run: triggerMenuOpen(triggerSelectionCheck),
    preventDefault: true,
  },
  {
    key: "Escape",
    run: closeMenu(triggerSelectionCheck),
    preventDefault: true,
  },
];
