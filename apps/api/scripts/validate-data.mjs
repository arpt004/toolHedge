import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataPath = resolve(fileURLToPath(new URL('.', import.meta.url)), '../data/software.json');
const products = JSON.parse(readFileSync(dataPath, 'utf8'));
const errors = [];
const enums = {
  billing: new Set(['RECURRING', 'ONE_TIME', 'LIFETIME']),
  unit: new Set(['DAY', 'WEEK', 'MONTH', 'YEAR']),
  model: new Set(['FLAT', 'PER_USER', 'USAGE', 'CUSTOM']),
  pricingType: new Set(['FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE']),
};
const add = (slug, message) => errors.push(`${slug}: ${message}`);

if (!Array.isArray(products)) throw new Error('software.json must contain a top-level array.');
const seen = new Set();
for (const product of products) {
  const slug = product?.slug ?? '<missing slug>';
  if (seen.has(slug)) add(slug, 'slug must be unique.');
  seen.add(slug);
  if (!enums.pricingType.has(product.pricingType)) add(slug, `invalid pricingType '${product.pricingType}'.`);
  if (!Array.isArray(product.plans)) { add(slug, 'plans must be an array.'); continue; }
  const recommended = product.plans.filter(plan => plan.isRecommended === true);
  if (recommended.length > 1) add(slug, 'at most one plan may be recommended.');

  for (const plan of product.plans) {
    if (!enums.model.has(plan.pricingModel)) add(slug, `plan '${plan.slug}' has invalid pricingModel.`);
    if (!Array.isArray(plan.highlights) || plan.highlights.length < 3 || plan.highlights.length > 6) add(slug, `plan '${plan.slug}' must have 3–6 highlights.`);
    if (!Array.isArray(plan.prices)) { add(slug, `plan '${plan.slug}' prices must be an array.`); continue; }
    if (plan.pricingModel === 'CUSTOM' && plan.prices.some(price => price.amount !== null)) add(slug, `custom plan '${plan.slug}' must use empty prices or null amounts.`);
    for (const price of plan.prices) {
      if (!enums.billing.has(price.billing)) add(slug, `plan '${plan.slug}' has invalid billing '${price.billing}'.`);
      if (typeof price.currency !== 'string' || !price.currency.trim()) add(slug, `plan '${plan.slug}' price requires currency.`);
      if (price.amount !== null && (!Number.isFinite(price.amount) || price.amount < 0)) add(slug, `plan '${plan.slug}' amount must be null or a non-negative number.`);
      if (price.billing === 'RECURRING') {
        if (!price.interval || !enums.unit.has(price.interval.unit) || !Number.isInteger(price.interval.count) || price.interval.count < 1) add(slug, `plan '${plan.slug}' recurring price needs a valid interval.`);
      } else if (price.interval !== undefined && price.interval !== null) {
        add(slug, `plan '${plan.slug}' ${price.billing} prices must not have an interval.`);
      }
    }
  }

  const freePlans = product.plans.filter(plan => plan.isFree);
  const paidPlans = product.plans.filter(plan => !plan.isFree);
  if (product.pricingType === 'FREE' || product.pricingType === 'OPEN_SOURCE') {
    const paidRecurring = product.plans.filter(plan => !plan.isFree && plan.prices.some(price => price.billing === 'RECURRING'));
    if (paidRecurring.length) add(slug, `${product.pricingType} products cannot have paid recurring plans.`);
    if (!freePlans.length) add(slug, `${product.pricingType} products require a free plan.`);
  }
  if (product.pricingType === 'PAID' && freePlans.length) add(slug, 'PAID products cannot have a free plan.');
  if (product.pricingType === 'FREEMIUM' && (!freePlans.length || !paidPlans.length)) add(slug, 'FREEMIUM products require at least one free and one paid plan.');

  for (const plan of product.plans.filter(item => item.isFree)) {
    if (plan.prices.length !== 1 || plan.prices[0].amount !== 0) add(slug, `free plan '${plan.slug}' must have exactly one zero-amount price.`);
  }
}

if (errors.length) {
  console.error(`software.json validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(` - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`software.json is valid: ${products.length} unique products, plans and prices passed validation.`);
}
