let pushToastExternal;

export const registerToast = (fn) => {
  pushToastExternal = fn;
};

export const resetToast = () => {
  pushToastExternal = undefined;
};

export const pushToast = (message) => {
  if (pushToastExternal) pushToastExternal(message);
};
