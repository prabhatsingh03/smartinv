import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { formatIsoDate, parseApiToForm } from '@utils/invoiceUtils';
import { uploadInvoiceFile, getInvoices, getInvoice, updateInvoice as apiUpdateInvoice, submitInvoice as apiSubmitInvoice, approveInvoice as apiApproveInvoice, rejectInvoice as apiRejectInvoice, listPending, listApproved, getInvoiceStatistics } from '@services/apiService';
export const uploadInvoiceFileThunk = createAsyncThunk('invoices/uploadFile', async (args, { rejectWithValue }) => {
    try {
        const res = await uploadInvoiceFile(args.file, args.onProgress);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Upload failed');
        // API returns { data: { item: Invoice } }
        const item = res.data.item;
        // Debug: log received item invoice_data and line_items
        try {
            console.debug('[uploadInvoiceFileThunk] item.invoice_data:', item?.invoice_data);
        }
        catch { }
        if (!item)
            return rejectWithValue('Invalid server response: missing item');
        return item;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Upload failed');
    }
});
export const listInvoicesThunk = createAsyncThunk('invoices/list', async (params, { rejectWithValue }) => {
    try {
        const res = await getInvoices(params);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Failed to load');
        return res.data.items;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
    }
});
export const fetchInvoiceThunk = createAsyncThunk('invoices/fetchOne', async (id, { rejectWithValue }) => {
    try {
        const res = await getInvoice(id);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Failed to load');
        return res.data;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
    }
});
export const updateInvoiceThunk = createAsyncThunk('invoices/update', async (args, { rejectWithValue }) => {
    try {
        const res = await apiUpdateInvoice(args.id, args.payload);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Update failed');
        const item = res.data?.item ?? res.data;
        return item;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Update failed');
    }
});
export const submitInvoiceThunk = createAsyncThunk('invoices/submit', async (id, { rejectWithValue }) => {
    console.log('submitInvoiceThunk called with id:', id);
    try {
        const res = await apiSubmitInvoice(id);
        console.log('submitInvoiceThunk API response:', res);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Submit failed');
        const item = res.data?.item ?? res.data;
        return item;
    }
    catch (e) {
        console.error('submitInvoiceThunk error:', e);
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Submit failed');
    }
});
export const approveInvoiceThunk = createAsyncThunk('invoices/approve', async (args, { rejectWithValue }) => {
    try {
        const res = await apiApproveInvoice(args.id, args.remarks);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Approve failed');
        const item = res.data?.item ?? res.data;
        return item;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Approve failed');
    }
});
export const rejectInvoiceThunk = createAsyncThunk('invoices/reject', async (args, { rejectWithValue }) => {
    try {
        const res = await apiRejectInvoice(args.id, args.remarks);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Reject failed');
        const item = res.data?.item ?? res.data;
        return item;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Reject failed');
    }
});
export const listPendingThunk = createAsyncThunk('invoices/listPending', async (params, { rejectWithValue }) => {
    try {
        const res = await listPending(params);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Failed to load');
        return res.data.items;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
    }
});
export const listApprovedThunk = createAsyncThunk('invoices/listApproved', async (params, { rejectWithValue }) => {
    try {
        const res = await listApproved(params);
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Failed to load');
        return res.data.items;
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
    }
});
export const financeStatsThunk = createAsyncThunk('invoices/financeStats', async (_, { rejectWithValue }) => {
    try {
        const res = await getInvoiceStatistics();
        if (!res.success || !res.data)
            return rejectWithValue(res.message || 'Failed to load');
        return res.data.stats ?? res.data; // prefer returning flat stats object
    }
    catch (e) {
        return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
    }
});
const initialState = {
    items: [],
    current: null,
    formValues: {},
    validationErrors: {},
    extractedLineItems: [],
    selectedLineItemIndex: null,
    lineItemApplicationStatus: 'idle',
    uploadProgress: 0,
    listStatus: 'idle',
    saveStatus: 'idle',
    submitStatus: 'idle',
    error: null,
    pendingItems: [],
    approvedItems: [],
    pendingStatus: 'idle',
    approvedStatus: 'idle',
    approving: false,
    rejecting: false,
    financeStats: undefined,
    statsStatus: 'idle'
};
const invoicesSlice = createSlice({
    name: 'invoices',
    initialState,
    reducers: {
        setFormValues(state, action) {
            state.formValues = { ...state.formValues, ...action.payload };
        },
        setUploadProgress(state, action) {
            state.uploadProgress = action.payload || 0;
        },
        setValidationErrors(state, action) {
            state.validationErrors = action.payload || {};
        },
        setSelectedLineItemIndex(state, action) {
            state.selectedLineItemIndex = typeof action.payload === 'number' ? action.payload : null;
        },
        clearSelectedLineItem(state) {
            state.selectedLineItemIndex = null;
        },
        setLineItemApplicationStatus(state, action) {
            state.lineItemApplicationStatus = action.payload;
        },
        setExtractedLineItems(state, action) {
            state.extractedLineItems = action.payload;
        },
        clearCurrent(state) {
            state.current = null;
            state.formValues = {};
            state.validationErrors = {};
            state.uploadProgress = 0;
            state.error = null;
            state.extractedLineItems = [];
            state.selectedLineItemIndex = null;
            state.lineItemApplicationStatus = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(uploadInvoiceFileThunk.pending, (state) => {
            state.saveStatus = 'loading';
            state.error = null;
            state.uploadProgress = 0;
        })
            .addCase(uploadInvoiceFileThunk.fulfilled, (state, action) => {
            state.saveStatus = 'succeeded';
            state.current = action.payload;
            // Capture extracted line items if present
            const topLevel = action.payload?.line_items;
            const nested = action.payload?.invoice_data?.line_items;
            const raw = Array.isArray(topLevel) ? topLevel : (Array.isArray(nested) ? nested : []);
            const items = Array.isArray(raw)
                ? raw
                    .filter((it) => it && typeof it === 'object')
                    .map((it) => ({
                    Line_Item: it.Line_Item ?? it.description ?? '',
                    HSN_SAC: it.HSN_SAC ?? it.hsn_sac ?? '',
                    gst_percent: it.gst_percent,
                    Basic_Amount: it.Basic_Amount ?? it.amount,
                    IGST_Amount: it.IGST_Amount ?? it.igst_amount,
                    CGST_Amount: it.CGST_Amount ?? it.cgst_amount,
                    SGST_Amount: it.SGST_Amount ?? it.sgst_amount,
                    Total_Amount: it.Total_Amount
                }))
                : [];
            try {
                console.debug('[invoiceSlice] line_items (top-level):', topLevel);
                console.debug('[invoiceSlice] line_items (nested):', nested);
                console.debug('[invoiceSlice] extractedLineItems (final):', items);
            }
            catch { }
            state.extractedLineItems = Array.isArray(items) ? items : [];
            state.selectedLineItemIndex = null;
            state.lineItemApplicationStatus = 'idle';
            // Initialize form values with extracted data from invoice.invoice_data
            const d = action.payload.invoice_data || {};
            state.formValues = parseApiToForm({
                S_No: d.S_No,
                Invoice_Date: formatIsoDate(d.Invoice_Date),
                Invoice_Number: d.Invoice_Number,
                GST_Number: d.GST_Number,
                Vendor_Name: d.Vendor_Name,
                Line_Item: d.Line_Item,
                HSN_SAC: d.HSN_SAC,
                gst_percent: d.gst_percent,
                IGST_Amount: d.IGST_Amount,
                CGST_Amount: d.CGST_Amount,
                SGST_Amount: d.SGST_Amount,
                Basic_Amount: d.Basic_Amount,
                Total_Amount: d.Total_Amount,
                TDS: d.TDS,
                Net_Payable: d.Net_Payable,
                filename: d.filename,
                remarks: action.payload.approval_remarks || null
            });
        })
            .addCase(uploadInvoiceFileThunk.rejected, (state, action) => {
            state.saveStatus = 'failed';
            state.error = action.payload || 'Upload failed';
        })
            .addCase(listInvoicesThunk.pending, (state) => {
            state.listStatus = 'loading';
            state.error = null;
        })
            .addCase(listInvoicesThunk.fulfilled, (state, action) => {
            state.listStatus = 'succeeded';
            state.items = action.payload;
        })
            .addCase(listInvoicesThunk.rejected, (state, action) => {
            state.listStatus = 'failed';
            state.error = action.payload || 'Failed to load invoices';
        })
            .addCase(fetchInvoiceThunk.fulfilled, (state, action) => {
            state.current = action.payload;
            const inv = action.payload;
            // Normalize extracted/selected line items for the editor
            const topLevel = inv?.line_items;
            const nested = inv?.invoice_data?.line_items;
            const raw = Array.isArray(topLevel) ? topLevel : (Array.isArray(nested) ? nested : []);
            const items = Array.isArray(raw)
                ? raw
                    .filter((it) => it && typeof it === 'object')
                    .map((it) => ({
                    Line_Item: it.Line_Item ?? it.description ?? '',
                    HSN_SAC: it.HSN_SAC ?? it.hsn_sac ?? '',
                    gst_percent: it.gst_percent,
                    Basic_Amount: it.Basic_Amount ?? it.amount,
                    IGST_Amount: it.IGST_Amount ?? it.igst_amount,
                    CGST_Amount: it.CGST_Amount ?? it.cgst_amount,
                    SGST_Amount: it.SGST_Amount ?? it.sgst_amount,
                    Total_Amount: it.Total_Amount
                }))
                : [];
            state.extractedLineItems = items;
            state.selectedLineItemIndex = null;
            state.lineItemApplicationStatus = 'idle';
            // Handle saved selected line items - if we have saved selections, use them as the source
            const savedSelectedItems = inv?.selected_line_items;
            if (Array.isArray(savedSelectedItems) && savedSelectedItems.length > 0) {
                // If we have saved selected items, use them as the extracted items
                // This ensures the component can properly match and preselect them
                state.extractedLineItems = savedSelectedItems.map((item) => ({
                    Line_Item: item.Line_Item ?? '',
                    HSN_SAC: item.HSN_SAC ?? '',
                    gst_percent: item.gst_percent,
                    Basic_Amount: item.Basic_Amount,
                    IGST_Amount: item.IGST_Amount,
                    CGST_Amount: item.CGST_Amount,
                    SGST_Amount: item.SGST_Amount,
                    Total_Amount: item.Total_Amount
                }));
            }
            // Initialize form values from invoice_data
            const d = inv?.invoice_data || {};
            state.formValues = parseApiToForm({
                S_No: d.S_No,
                Invoice_Date: formatIsoDate(d.Invoice_Date),
                Invoice_Number: d.Invoice_Number,
                GST_Number: d.GST_Number,
                Vendor_Name: d.Vendor_Name,
                Line_Item: d.Line_Item,
                HSN_SAC: d.HSN_SAC,
                gst_percent: d.gst_percent,
                IGST_Amount: d.IGST_Amount,
                CGST_Amount: d.CGST_Amount,
                SGST_Amount: d.SGST_Amount,
                Basic_Amount: d.Basic_Amount,
                Total_Amount: d.Total_Amount,
                TDS: d.TDS,
                Net_Payable: d.Net_Payable,
                filename: d.filename,
                remarks: inv?.approval_remarks || null
            });
        })
            .addCase(updateInvoiceThunk.pending, (state) => {
            state.saveStatus = 'loading';
            state.error = null;
        })
            .addCase(updateInvoiceThunk.fulfilled, (state, action) => {
            state.saveStatus = 'succeeded';
            state.current = action.payload;
            state.items = state.items.map((it) => (it.id === action.payload.id ? action.payload : it));
        })
            .addCase(updateInvoiceThunk.rejected, (state, action) => {
            state.saveStatus = 'failed';
            state.error = action.payload || 'Update failed';
        })
            .addCase(submitInvoiceThunk.pending, (state) => {
            state.submitStatus = 'loading';
            state.error = null;
        })
            .addCase(submitInvoiceThunk.fulfilled, (state, action) => {
            state.submitStatus = 'succeeded';
            state.current = action.payload;
            state.items = state.items.map((it) => (it.id === action.payload.id ? action.payload : it));
        })
            .addCase(submitInvoiceThunk.rejected, (state, action) => {
            state.submitStatus = 'failed';
            state.error = action.payload || 'Submit failed';
        })
            .addCase(approveInvoiceThunk.fulfilled, (state, action) => {
            state.approving = false;
            state.current = action.payload;
            state.items = state.items.map((it) => (it.id === action.payload.id ? action.payload : it));
            state.pendingItems = state.pendingItems.filter((it) => it.id !== action.payload.id);
            state.approvedItems = [action.payload, ...state.approvedItems];
        })
            .addCase(approveInvoiceThunk.pending, (state) => {
            state.approving = true;
        })
            .addCase(approveInvoiceThunk.rejected, (state, action) => {
            state.approving = false;
            state.error = action.payload || 'Approve failed';
        })
            .addCase(rejectInvoiceThunk.fulfilled, (state, action) => {
            state.rejecting = false;
            state.current = action.payload;
            state.items = state.items.map((it) => (it.id === action.payload.id ? action.payload : it));
            state.pendingItems = state.pendingItems.filter((it) => it.id !== action.payload.id);
        })
            .addCase(rejectInvoiceThunk.pending, (state) => {
            state.rejecting = true;
        })
            .addCase(rejectInvoiceThunk.rejected, (state, action) => {
            state.rejecting = false;
            state.error = action.payload || 'Reject failed';
        })
            .addCase(listPendingThunk.pending, (state) => {
            state.pendingStatus = 'loading';
        })
            .addCase(listPendingThunk.fulfilled, (state, action) => {
            state.pendingStatus = 'succeeded';
            state.pendingItems = action.payload;
        })
            .addCase(listPendingThunk.rejected, (state, action) => {
            state.pendingStatus = 'failed';
            state.error = action.payload || 'Failed to load pending';
        })
            .addCase(listApprovedThunk.pending, (state) => {
            state.approvedStatus = 'loading';
        })
            .addCase(listApprovedThunk.fulfilled, (state, action) => {
            state.approvedStatus = 'succeeded';
            state.approvedItems = action.payload;
        })
            .addCase(listApprovedThunk.rejected, (state, action) => {
            state.approvedStatus = 'failed';
            state.error = action.payload || 'Failed to load approved';
        })
            .addCase(financeStatsThunk.pending, (state) => {
            state.statsStatus = 'loading';
        })
            .addCase(financeStatsThunk.fulfilled, (state, action) => {
            state.statsStatus = 'succeeded';
            state.financeStats = action.payload;
        })
            .addCase(financeStatsThunk.rejected, (state, action) => {
            state.statsStatus = 'failed';
            state.error = action.payload || 'Failed to load statistics';
        });
    }
});
export const { setFormValues, setValidationErrors, clearCurrent, setSelectedLineItemIndex, clearSelectedLineItem, setLineItemApplicationStatus, setExtractedLineItems } = invoicesSlice.actions;
export const { setUploadProgress } = invoicesSlice.actions;
export default invoicesSlice.reducer;
