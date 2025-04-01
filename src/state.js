const state = {
  panel: null,
  visible: false,
  activeTextarea: null,
  activeDecorations: new Set(),
  position: { right: "20px", bottom: "20px" },
  buttonPosition: { right: "20px", bottom: "80px" },
  helpDialogPosition: { top: "50%", left: "50%" },
  isExpanded: true,
  floatingButton: null,
  originalLabels: null,
  originalDecorations: null,
  customLabels: null,
  customDecorations: null,
};

export default state;
