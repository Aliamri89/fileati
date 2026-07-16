import * as migration_20260715_005101 from './20260715_005101';
import * as migration_20260716_120000_add_tool_usage_error_fields from './20260716_120000_add_tool_usage_error_fields';
import * as migration_20260716_133706_add_static_pages_drafts_autosave from './20260716_133706_add_static_pages_drafts_autosave';
import * as migration_20260716_154713_backfill_static_pages_versions from './20260716_154713_backfill_static_pages_versions';
import * as migration_20260716_181433_add_faqs_collection from './20260716_181433_add_faqs_collection';

export const migrations = [
  {
    up: migration_20260715_005101.up,
    down: migration_20260715_005101.down,
    name: '20260715_005101',
  },
  {
    up: migration_20260716_120000_add_tool_usage_error_fields.up,
    down: migration_20260716_120000_add_tool_usage_error_fields.down,
    name: '20260716_120000_add_tool_usage_error_fields',
  },
  {
    up: migration_20260716_133706_add_static_pages_drafts_autosave.up,
    down: migration_20260716_133706_add_static_pages_drafts_autosave.down,
    name: '20260716_133706_add_static_pages_drafts_autosave',
  },
  {
    up: migration_20260716_154713_backfill_static_pages_versions.up,
    down: migration_20260716_154713_backfill_static_pages_versions.down,
    name: '20260716_154713_backfill_static_pages_versions',
  },
  {
    up: migration_20260716_181433_add_faqs_collection.up,
    down: migration_20260716_181433_add_faqs_collection.down,
    name: '20260716_181433_add_faqs_collection'
  },
];
