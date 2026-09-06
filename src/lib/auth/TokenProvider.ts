// A simple static provider to hold the token outside of React lifecycle
// so the ApiClient can access it transparently.

let currentToken: string | null = null;

export const TokenProvider = {
  getToken: () => currentToken,
  setToken: (token: string | null) => {
    currentToken = token;
  },
};
