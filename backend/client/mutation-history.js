function renderMutationHistory(history) {
    const rows = (history || []).map(row => ({
        createdAt: formatDateTimeIst(row.created_at),
        changeSummary: formatMutationHistoryChange(row),
        source: formatMutationSource(row.source),
        status: row.status,
        outcome: mutationHistoryOutcome(row)
    }));
    initGrid('grid-controlsMutationHistory', rows, [
        { field: 'createdAt', headerName: 'Created', pinned: 'left', minWidth: 180, cellRenderer: controlsTextCell },
        { field: 'changeSummary', headerName: 'Change', minWidth: 420, wrapText: true, autoHeight: true, cellRenderer: controlsTextCell },
        { field: 'source', headerName: 'Origin', minWidth: 110, maxWidth: 140, cellRenderer: controlsTextCell },
        { field: 'status', headerName: 'Status', minWidth: 130, maxWidth: 160, cellRenderer: p => controlsStatusChip(p.value) },
        { field: 'outcome', headerName: 'Outcome', minWidth: 280, wrapText: true, autoHeight: true, cellRenderer: controlsTextCell }
    ]);
}

function formatMutationSource(source) {
    const normalized = String(source || '').toLowerCase();
    if (normalized === 'ui') return 'Dashboard';
    if (normalized === 'mcp') return 'MCP';
    return formatControlStatus(source || 'Unknown');
}

function formatMutationHistoryChange(row) {
    const payload = row?.preview_payload || {};
    const diff = Array.isArray(payload.diff) ? payload.diff : [];
    if (!diff.length) return formatControlStatus(row?.mutation_type);
    const groups = groupedMutationDiffs(diff);
    const summaries = groups.slice(0, 3).map(group => formatMutationDiffGroup(group, row?.mutation_type)).filter(Boolean);
    const remaining = groups.slice(3).reduce((total, group) => total + group.length, 0);
    const suffix = remaining ? ` + ${remaining} more` : '';
    return `${summaries.join('; ')}${suffix}` || formatControlStatus(row?.mutation_type);
}

function mutationHistoryOutcome(row) {
    if (row.status === 'in_progress') return 'Confirmation in progress. Check this history before trying again.';
    if (row.status === 'needs_review') {
        const path = row.error_payload?.partialFailure?.failedPath || row.result_payload?.inFlightPath;
        return path
            ? `Check current Google Ads state before creating another preview. Unconfirmed call: ${path}.`
            : 'Check current Google Ads state before creating another preview.';
    }
    return row.error_payload?.partialFailure?.message || '';
}
