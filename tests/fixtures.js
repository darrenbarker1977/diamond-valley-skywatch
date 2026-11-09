import {test as base,expect} from '@playwright/test';
export const test=base.extend({context:async({context},use)=>{await context.route('https://api.weather.gc.ca/**',r=>r.abort());await context.route('**/data/weather-diamond-valley.json',r=>r.abort());await use(context);}});
export {expect};
