import base from './playwright.config.js';
export default { ...base, testIgnore: undefined, testMatch: '**/visual.spec.js' };
