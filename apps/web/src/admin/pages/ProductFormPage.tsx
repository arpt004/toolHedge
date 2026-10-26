import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi, AdminApiError } from '../api';
import { AdminProductFormOptions, PLATFORM_OPTIONS } from '../types';

const PRICING_TYPES = ['FREE', 'FREEMIUM', 'PAID', 'OPEN_SOURCE'] as const;
const SOFTWARE_STATUSES = ['ACTIVE', 'BETA', 'DISCONTINUED', 'ACQUIRED'] as const;
const CONTENT_STATUSES = ['DRAFT', 'NEEDS_REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
const DEPLOYMENT_OPTIONS = ['CLOUD', 'ON_PREMISES', 'SELF_HOSTED', 'HYBRID'] as const;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface FormState {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  overview: string;
  howItWorks: string;
  logoUrl: string;
  websiteUrl: string;
  affiliateUrl: string;
  pricingUrl: string;
  pricingType: (typeof PRICING_TYPES)[number];
  platforms: string[];
  status: (typeof SOFTWARE_STATUSES)[number];
  contentStatus: (typeof CONTENT_STATUSES)[number];
  deploymentOptions: string[];
  supportedLanguages: string;
  supportedRegions: string;
  headquarters: string;
  licenseType: string;
  isOpenSource: boolean;
  hasFreeTrial: boolean;
  hasFreePlan: boolean;
  isVerified: boolean;
  categorySlugs: string[];
  tagsText: string;
}

const EMPTY_FORM: FormState = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  longDescription: '',
  overview: '',
  howItWorks: '',
  logoUrl: '',
  websiteUrl: '',
  affiliateUrl: '',
  pricingUrl: '',
  pricingType: 'FREEMIUM',
  platforms: [],
  status: 'ACTIVE',
  contentStatus: 'DRAFT',
  deploymentOptions: [],
  supportedLanguages: '',
  supportedRegions: '',
  headquarters: '',
  licenseType: '',
  isOpenSource: false,
  hasFreeTrial: false,
  hasFreePlan: false,
  isVerified: false,
  categorySlugs: [],
  tagsText: '',
};

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [options, setOptions] = useState<AdminProductFormOptions | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    adminApi.getProductFormOptions().then(setOptions).catch(() => setOptions({ categories: [], tags: [] }));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApi
      .getProduct(Number(id))
      .then((product) => {
        const next: FormState = {
          slug: product.slug,
          name: product.name,
          tagline: product.tagline,
          description: product.description,
          longDescription: product.longDescription ?? '',
          overview: product.overview ?? '',
          howItWorks: product.howItWorks ?? '',
          logoUrl: product.logoUrl ?? '',
          websiteUrl: product.websiteUrl ?? '',
          affiliateUrl: product.affiliateUrl ?? '',
          pricingUrl: product.pricingUrl ?? '',
          pricingType: product.pricingType,
          platforms: product.platforms,
          status: product.status,
          contentStatus: product.contentStatus,
          deploymentOptions: product.deploymentOptions,
          supportedLanguages: product.supportedLanguages.join(', '),
          supportedRegions: product.supportedRegions.join(', '),
          headquarters: product.headquarters ?? '',
          licenseType: product.licenseType ?? '',
          isOpenSource: product.isOpenSource,
          hasFreeTrial: product.hasFreeTrial,
          hasFreePlan: product.hasFreePlan,
          isVerified: product.isVerified,
          categorySlugs: product.categories.map((c) => c.slug),
          tagsText: product.tags.map((t) => t.name).join(', '),
        };
        setForm(next);
        setInitialForm(next);
        setExpectedUpdatedAt(product.updatedAt);
      })
      .catch(() => setError('Could not load this product.'))
      .finally(() => setLoading(false));
  }, [id]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleInArray = (key: 'platforms' | 'deploymentOptions' | 'categorySlugs', value: string) =>
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((v) => v !== value) : [...current[key], value],
    }));

  const onCancel = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them?')) return;
    navigate('/admin/products');
  };

  const buildPayload = useCallback(() => {
    const tagSlugs = form.tagsText
      .split(',')
      .map((t) => slugify(t))
      .filter(Boolean);
    return {
      slug: slugify(form.slug || form.name),
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      longDescription: form.longDescription.trim() || null,
      overview: form.overview.trim() || null,
      howItWorks: form.howItWorks.trim() || null,
      logoUrl: form.logoUrl.trim() || null,
      websiteUrl: form.websiteUrl.trim() || null,
      affiliateUrl: form.affiliateUrl.trim() || null,
      pricingUrl: form.pricingUrl.trim() || null,
      pricingType: form.pricingType,
      platforms: form.platforms,
      status: form.status,
      contentStatus: form.contentStatus,
      deploymentOptions: form.deploymentOptions,
      supportedLanguages: form.supportedLanguages.split(',').map((v) => v.trim()).filter(Boolean),
      supportedRegions: form.supportedRegions.split(',').map((v) => v.trim()).filter(Boolean),
      headquarters: form.headquarters.trim() || null,
      licenseType: form.licenseType.trim() || null,
      isOpenSource: form.isOpenSource,
      hasFreeTrial: form.hasFreeTrial,
      hasFreePlan: form.hasFreePlan,
      isVerified: form.isVerified,
      categorySlugs: form.categorySlugs,
      tagSlugs,
    };
  }, [form]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.slug.trim() && !form.name.trim()) errors.slug = 'Slug or name is required.';
    if (!form.tagline.trim()) errors.tagline = 'Tagline is required.';
    if (!form.description.trim()) errors.description = 'Description is required.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!validate()) return;
    setError('');
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        const updated = await adminApi.updateProduct(Number(id), { ...payload, expectedUpdatedAt });
        setExpectedUpdatedAt(updated.updatedAt);
        setInitialForm(form);
      } else {
        const created = await adminApi.createProduct(payload);
        navigate(`/admin/products/${created.id}/edit`, { replace: true });
        return;
      }
      navigate('/admin/products');
    } catch (reason) {
      if (reason instanceof AdminApiError) {
        if (reason.code === 'SLUG_CONFLICT') setFieldErrors({ slug: reason.message });
        else if (reason.code === 'STALE_UPDATE') setError(reason.message);
        else if (reason.code === 'VALIDATION_ERROR') setError('Please check the highlighted fields and try again.');
        else setError(reason.message);
      } else {
        setError('Could not save this product. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <div className="admin-breadcrumbs">
        <Link to="/admin/products">Products</Link>
        <span>/</span>
        <span>{isEdit ? form.name || 'Edit product' : 'New product'}</span>
      </div>
      <div className="admin-page-header">
        <div>
          <h1>{isEdit ? `Edit ${initialForm.name}` : 'Add product'}</h1>
          <p>{isEdit ? 'Changes publish immediately once saved.' : 'Fill in the core details — you can refine content later.'}</p>
        </div>
        {isEdit && (
          <a className="button button-secondary" href={`/software/${initialForm.slug}`} target="_blank" rel="noreferrer">
            View on site ↗
          </a>
        )}
      </div>

      {error && <div className="admin-banner-error">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="admin-card">
          <h2>Basics</h2>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Name *</label>
              <input className="admin-input" value={form.name} onChange={(e) => update('name', e.target.value)} />
              {fieldErrors.name && <span className="admin-field-error">{fieldErrors.name}</span>}
            </div>
            <div className="admin-field">
              <label>Slug (unique identifier)</label>
              <input
                className="admin-input"
                placeholder={slugify(form.name) || 'auto-generated-from-name'}
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
              />
              {fieldErrors.slug && <span className="admin-field-error">{fieldErrors.slug}</span>}
              <span className="admin-field-hint">Used in the product URL. Lowercase letters, numbers, hyphens.</span>
            </div>
            <div className="admin-field span-2">
              <label>Tagline *</label>
              <input className="admin-input" value={form.tagline} onChange={(e) => update('tagline', e.target.value)} />
              {fieldErrors.tagline && <span className="admin-field-error">{fieldErrors.tagline}</span>}
            </div>
            <div className="admin-field span-2">
              <label>Description *</label>
              <textarea
                className="admin-textarea"
                rows={3}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
              {fieldErrors.description && <span className="admin-field-error">{fieldErrors.description}</span>}
            </div>
            <div className="admin-field span-2">
              <label>Long description</label>
              <textarea
                className="admin-textarea"
                rows={3}
                value={form.longDescription}
                onChange={(e) => update('longDescription', e.target.value)}
              />
            </div>
            <div className="admin-field span-2">
              <label>Overview</label>
              <textarea className="admin-textarea" rows={2} value={form.overview} onChange={(e) => update('overview', e.target.value)} />
            </div>
            <div className="admin-field span-2">
              <label>How it works</label>
              <textarea
                className="admin-textarea"
                rows={2}
                value={form.howItWorks}
                onChange={(e) => update('howItWorks', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Links &amp; media</h2>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Logo URL</label>
              <input className="admin-input" value={form.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Website URL</label>
              <input className="admin-input" value={form.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Affiliate URL</label>
              <input className="admin-input" value={form.affiliateUrl} onChange={(e) => update('affiliateUrl', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Pricing page URL</label>
              <input className="admin-input" value={form.pricingUrl} onChange={(e) => update('pricingUrl', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Classification</h2>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Pricing type</label>
              <select className="admin-select" value={form.pricingType} onChange={(e) => update('pricingType', e.target.value as FormState['pricingType'])}>
                {PRICING_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Lifecycle status</label>
              <select className="admin-select" value={form.status} onChange={(e) => update('status', e.target.value as FormState['status'])}>
                {SOFTWARE_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label>Visibility</label>
              <select
                className="admin-select"
                value={form.contentStatus}
                onChange={(e) => update('contentStatus', e.target.value as FormState['contentStatus'])}
              >
                {CONTENT_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <span className="admin-field-hint">Only PUBLISHED products appear on the public site.</span>
            </div>
            <div className="admin-field">
              <label>Headquarters</label>
              <input className="admin-input" value={form.headquarters} onChange={(e) => update('headquarters', e.target.value)} />
            </div>
            <div className="admin-field span-2">
              <label>Platforms</label>
              <div className="admin-checkbox-grid">
                {PLATFORM_OPTIONS.map((platform) => (
                  <span
                    key={platform}
                    className={`admin-chip-toggle${form.platforms.includes(platform) ? ' is-selected' : ''}`}
                    onClick={() => toggleInArray('platforms', platform)}
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
            <div className="admin-field span-2">
              <label>Deployment options</label>
              <div className="admin-checkbox-grid">
                {DEPLOYMENT_OPTIONS.map((opt) => (
                  <span
                    key={opt}
                    className={`admin-chip-toggle${form.deploymentOptions.includes(opt) ? ' is-selected' : ''}`}
                    onClick={() => toggleInArray('deploymentOptions', opt)}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
            <div className="admin-field span-2">
              <label>Categories</label>
              <div className="admin-checkbox-grid">
                {(options?.categories ?? []).map((cat) => (
                  <span
                    key={cat.slug}
                    className={`admin-chip-toggle${form.categorySlugs.includes(cat.slug) ? ' is-selected' : ''}`}
                    onClick={() => toggleInArray('categorySlugs', cat.slug)}
                  >
                    {cat.name}
                  </span>
                ))}
                {options && options.categories.length === 0 && (
                  <span className="admin-field-hint">No categories yet — create one first.</span>
                )}
              </div>
            </div>
            <div className="admin-field span-2">
              <label>Tags (comma separated)</label>
              <input className="admin-input" value={form.tagsText} onChange={(e) => update('tagsText', e.target.value)} />
              <span className="admin-field-hint">New tags are created automatically.</span>
            </div>
            <div className="admin-field">
              <label>Supported languages (comma separated)</label>
              <input className="admin-input" value={form.supportedLanguages} onChange={(e) => update('supportedLanguages', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>Supported regions (comma separated)</label>
              <input className="admin-input" value={form.supportedRegions} onChange={(e) => update('supportedRegions', e.target.value)} />
            </div>
            <div className="admin-field">
              <label>License type</label>
              <input className="admin-input" value={form.licenseType} onChange={(e) => update('licenseType', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Flags</h2>
          <div className="admin-checkbox-grid">
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.isOpenSource} onChange={(e) => update('isOpenSource', e.target.checked)} />
              Open source
            </label>
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.hasFreeTrial} onChange={(e) => update('hasFreeTrial', e.target.checked)} />
              Has free trial
            </label>
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.hasFreePlan} onChange={(e) => update('hasFreePlan', e.target.checked)} />
              Has free plan
            </label>
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.isVerified} onChange={(e) => update('isVerified', e.target.checked)} />
              Verified listing
            </label>
          </div>
        </div>

        <div className="admin-form-actions">
          {isDirty && <span className="admin-field-hint" style={{ alignSelf: 'center', marginRight: 'auto' }}>Unsaved changes</span>}
          <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}
