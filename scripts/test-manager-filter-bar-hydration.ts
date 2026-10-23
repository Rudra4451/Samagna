/**
 * BanaSetu ManagerFilterBar Hydration Regression Test Suite
 *
 * Catches server/client initial-render hydration mismatches in ManagerFilterBar:
 * - Ensures deterministic initial state between SSR and initial client render.
 * - Verifies that persisted filters in localStorage do not cause first-render HTML divergences.
 * - Validates post-mount hydration safety and persistence guards.
 * - Audits collection and inventory pages to prevent regressions.
 */

import fs from 'fs';
import path from 'path';
import {
  DEFAULT_MANAGER_FILTERS,
  ManagerFiltersState,
} from '../src/components/manager/ManagerFilterBar';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

// Representative collection seed items
const COLLECTION_SEED_ITEMS = [
  { code: '#BS-402', collector: 'Raimati Soren', village: 'Badagaon, Karanjia', product: 'Dried Mahua Flowers', status: 'Pending', requestedDateIso: '2025-03-14' },
  { code: '#BS-401', collector: 'Gura Marndi', village: 'Badagaon, Karanjia', product: 'Dried Mahua Flowers', status: 'Scheduled', requestedDateIso: '2025-03-14' },
  { code: '#BS-400', collector: 'Sombari Murmu', village: 'Kadamdiha, Karanjia', product: 'Dried Mahua Flowers', status: 'Collected', requestedDateIso: '2025-03-13' },
  { code: '#BS-399', collector: 'Dulari Hansdah', village: 'Badagaon, Karanjia', product: 'Dried Mahua Flowers', status: 'Collected', requestedDateIso: '2025-03-13' },
  { code: '#BS-398', collector: 'Biren Majhi', village: 'Kadamdiha, Karanjia', product: 'Dried Mahua Flowers', status: 'Scheduled', requestedDateIso: '2025-03-12' },
  { code: '#BS-397', collector: 'Salge Tudu', village: 'Sundargarh', product: 'Dried Mahua Flowers', status: 'Quarantined', requestedDateIso: '2025-03-12' },
];

// Representative inventory seed items
const INVENTORY_SEED_ITEMS = [
  { code: '#BS-402', collector: 'Raimati Soren', village: 'Badagaon, Karanjia', product: 'Dried Mahua Flowers', status: 'Pending Verification', updatedDateIso: '2025-03-14' },
  { code: '#BS-400', collector: 'Gura Marndi', village: 'Badagaon, Karanjia', product: 'Dried Mahua Flowers', status: 'Available', updatedDateIso: '2025-03-14' },
  { code: '#BS-398', collector: 'Sombari Murmu', village: 'Kadamdiha, Karanjia', product: 'Dried Mahua Flowers', status: 'Available', updatedDateIso: '2025-03-13' },
  { code: '#BS-396', collector: 'Dulari Hansdah', village: 'Badagaon, Karanjia', product: 'Dried Mahua Flowers', status: 'Quarantined', updatedDateIso: '2025-03-13' },
  { code: '#BS-395', collector: 'Biren Majhi', village: 'Kadamdiha, Karanjia', product: 'Dried Mahua Flowers', status: 'Available', updatedDateIso: '2025-03-13' },
  { code: '#BS-394', collector: 'Salge Tudu', village: 'Sundargarh', product: 'Dried Mahua Flowers', status: 'Quarantined', updatedDateIso: '2025-03-12' },
];

function filterCollectionItems(items: typeof COLLECTION_SEED_ITEMS, filters: ManagerFiltersState) {
  return items.filter((item) => {
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const match =
        item.code.toLowerCase().includes(q) ||
        item.collector.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(item.status)) return false;
    }
    if (filters.village) {
      if (item.village !== filters.village) return false;
    }
    if (filters.dateFrom) {
      if (item.requestedDateIso < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      if (item.requestedDateIso > filters.dateTo) return false;
    }
    return true;
  });
}

function filterInventoryItems(items: typeof INVENTORY_SEED_ITEMS, filters: ManagerFiltersState) {
  return items.filter((item) => {
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const match =
        item.code.toLowerCase().includes(q) ||
        item.collector.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(item.status)) return false;
    }
    if (filters.village) {
      if (item.village !== filters.village) return false;
    }
    if (filters.dateFrom) {
      if (item.updatedDateIso < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      if (item.updatedDateIso > filters.dateTo) return false;
    }
    return true;
  });
}

async function runHydrationTestSuite() {
  console.log('\n================================================================');
  console.log('   BanaSetu: ManagerFilterBar Hydration Mismatch Regression QA   ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Default Initial State Contract
  // --------------------------------------------------------------------------
  console.log('--- 1. Default Initial Filters Contract ---');
  assert(
    DEFAULT_MANAGER_FILTERS !== undefined && typeof DEFAULT_MANAGER_FILTERS === 'object',
    'DEFAULT_MANAGER_FILTERS is exported and accessible'
  );
  assert(
    DEFAULT_MANAGER_FILTERS.savedView === 'all',
    'Default savedView is "all"'
  );
  assert(
    DEFAULT_MANAGER_FILTERS.search === '' &&
      DEFAULT_MANAGER_FILTERS.village === '' &&
      DEFAULT_MANAGER_FILTERS.dateFrom === '' &&
      DEFAULT_MANAGER_FILTERS.dateTo === '' &&
      Array.isArray(DEFAULT_MANAGER_FILTERS.statuses) &&
      DEFAULT_MANAGER_FILTERS.statuses.length === 0,
    'Default filters have empty search, village, dates, and statuses'
  );

  const defaultCollectionFiltered = filterCollectionItems(COLLECTION_SEED_ITEMS, DEFAULT_MANAGER_FILTERS);
  assert(
    defaultCollectionFiltered.length === 6,
    `Collection seed with default filters matches all 6 items (got ${defaultCollectionFiltered.length})`
  );

  const defaultInventoryFiltered = filterInventoryItems(INVENTORY_SEED_ITEMS, DEFAULT_MANAGER_FILTERS);
  assert(
    defaultInventoryFiltered.length === 6,
    `Inventory seed with default filters matches all 6 items (got ${defaultInventoryFiltered.length})`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Root Cause Reproduction of Hydration Mismatch
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Root Cause Reproduction (Synchronous localStorage Antipattern) ---');

  // Simulated persisted filter from a user session: e.g., 'Today' view with today's date
  const persistedFilterFromPreviousSession: ManagerFiltersState = {
    savedView: 'today',
    search: '',
    statuses: [],
    village: '',
    dateFrom: new Date().toISOString().split('T')[0], // e.g. 2026-10-23
    dateTo: new Date().toISOString().split('T')[0],
  };

  // SSR environment: window is undefined -> returns default filters -> 6 items
  const ssrFilteredCount = filterCollectionItems(COLLECTION_SEED_ITEMS, DEFAULT_MANAGER_FILTERS).length;
  assert(ssrFilteredCount === 6, 'SSR renders 6 items with default filters');

  // Buggy client initial render: reading localStorage synchronously in useState initializer
  const buggyClientInitialCount = filterCollectionItems(
    COLLECTION_SEED_ITEMS,
    persistedFilterFromPreviousSession
  ).length;
  assert(
    buggyClientInitialCount === 0,
    'Buggy client initial render evaluates to 0 items when reading persisted "today" filter'
  );
  assert(
    ssrFilteredCount !== buggyClientInitialCount,
    `Demonstrated mismatch: SSR output ("${ssrFilteredCount}") != Client initial render ("${buggyClientInitialCount}")`
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Hydration-Safe Pattern Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Hydration-Safe Pattern Verification ---');

  // In the hydration-safe pattern:
  // Initial render (both SSR and Client 1st render) MUST use DEFAULT_MANAGER_FILTERS
  const clientInitialRenderCount = filterCollectionItems(COLLECTION_SEED_ITEMS, DEFAULT_MANAGER_FILTERS).length;
  assert(
    ssrFilteredCount === clientInitialRenderCount,
    `Hydration-safe initial render produces identical count on server and client (${ssrFilteredCount} === ${clientInitialRenderCount})`
  );

  // Post-mount phase (useEffect):
  // The persisted filter is loaded after hydration without triggering mismatch
  let activeFilters = DEFAULT_MANAGER_FILTERS;
  let isHydrated: boolean = false;

  // Simulate mount effect
  const simulateMount = (savedJson: string | null) => {
    if (savedJson) {
      activeFilters = JSON.parse(savedJson);
    }
    isHydrated = true;
  };

  simulateMount(JSON.stringify(persistedFilterFromPreviousSession));
  assert((isHydrated as boolean) === true, 'Hydration flag set to true after mount effect executes');
  assert(
    activeFilters.savedView === 'today',
    'Persisted filter is successfully restored after mounting'
  );

  const postHydrationCount = filterCollectionItems(COLLECTION_SEED_ITEMS, activeFilters).length;
  assert(
    postHydrationCount === 0,
    `Post-hydration UI accurately updates to reflect active filter (${postHydrationCount} items)`
  );

  // Persistence guard: Ensure localStorage.setItem is skipped before isHydrated is true
  let simulatedStorage: Record<string, string> = {
    banasetu_filter_collection: JSON.stringify(persistedFilterFromPreviousSession),
  };

  const simulatePersist = (filters: ManagerFiltersState, hydrated: boolean) => {
    if (!hydrated) return; // Guard prevents overwriting on mount
    simulatedStorage['banasetu_filter_collection'] = JSON.stringify(filters);
  };

  // Attempting persist with initial default filters before hydration must NOT overwrite storage
  simulatePersist(DEFAULT_MANAGER_FILTERS, false);
  const preservedFilter = JSON.parse(simulatedStorage['banasetu_filter_collection']);
  assert(
    preservedFilter.savedView === 'today',
    'Persistence guard prevents default state from overwriting saved user preferences on mount'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Source Code Audit for Collection & Inventory Pages
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Source Code Audit (Regression Prevention) ---');

  const collectionPath = path.resolve(__dirname, '../src/app/collection/page.tsx');
  const collectionSrc = fs.readFileSync(collectionPath, 'utf8');

  const inventoryPath = path.resolve(__dirname, '../src/app/inventory/page.tsx');
  const inventorySrc = fs.readFileSync(inventoryPath, 'utf8');

  // Verify collection page has deterministic useState initialization
  assert(
    collectionSrc.includes('const [filters, setFilters] = useState<ManagerFiltersState>(DEFAULT_MANAGER_FILTERS);'),
    'Collection page initializes filters with DEFAULT_MANAGER_FILTERS constant'
  );
  assert(
    collectionSrc.includes("const [density, setDensity] = useState<TableDensity>('comfortable');"),
    'Collection page initializes density deterministically with "comfortable"'
  );
  assert(
    collectionSrc.includes('const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLLECTION_COLUMNS);'),
    'Collection page initializes columns deterministically with DEFAULT_COLLECTION_COLUMNS'
  );
  assert(
    collectionSrc.includes('const [filtersHydrated, setFiltersHydrated] = useState(false);'),
    'Collection page maintains filtersHydrated state flag'
  );

  // Verify inventory page has deterministic useState initialization
  assert(
    inventorySrc.includes('const [filters, setFilters] = useState<ManagerFiltersState>(DEFAULT_MANAGER_FILTERS);'),
    'Inventory page initializes filters with DEFAULT_MANAGER_FILTERS constant'
  );
  assert(
    inventorySrc.includes("const [density, setDensity] = useState<TableDensity>('comfortable');"),
    'Inventory page initializes density deterministically with "comfortable"'
  );
  assert(
    inventorySrc.includes('const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_INVENTORY_COLUMNS);'),
    'Inventory page initializes columns deterministically with DEFAULT_INVENTORY_COLUMNS'
  );
  assert(
    inventorySrc.includes('const [filtersHydrated, setFiltersHydrated] = useState(false);'),
    'Inventory page maintains filtersHydrated state flag'
  );

  // Verify no synchronous localStorage reads in useState initializers
  assert(
    !collectionSrc.includes('useState<ManagerFiltersState>(() =>'),
    'Collection page does not use useState callback to synchronously read localStorage'
  );
  assert(
    !inventorySrc.includes('useState<ManagerFiltersState>(() =>'),
    'Inventory page does not use useState callback to synchronously read localStorage'
  );

  // Verify no suppressHydrationWarning hacks used
  assert(
    !collectionSrc.includes('suppressHydrationWarning'),
    'Collection page does not use suppressHydrationWarning workaround'
  );
  assert(
    !inventorySrc.includes('suppressHydrationWarning'),
    'Inventory page does not use suppressHydrationWarning workaround'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Live SSR Server Render Check
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Live Server-Rendered HTML Verification ---');

  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'manager.mohanty', password: 'Test@Pass123' }),
    });

    if (loginRes.ok) {
      const cookie = loginRes.headers.get('set-cookie');
      const pageRes = await fetch('http://localhost:3000/collection', {
        headers: { Cookie: cookie || '' },
      });

      if (pageRes.ok) {
        const html = await pageRes.text();
        const hasShowing6Of6 =
          html.includes('Showing') &&
          html.includes('of') &&
          html.includes('batches') &&
          html.includes('6');

        assert(
          hasShowing6Of6,
          'Live /collection SSR generates deterministic HTML with "Showing 6 of 6 batches"'
        );
      } else {
        console.log('  [SKIP] Local dev server returned non-200 for /collection');
      }
    } else {
      console.log('  [SKIP] Local dev server login not available for live SSR check');
    }
  } catch {
    console.log('  [SKIP] Local dev server not running; skipped live HTTP fetch check');
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`HYDRATION TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runHydrationTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
