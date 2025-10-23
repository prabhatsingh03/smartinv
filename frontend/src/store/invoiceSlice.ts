import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Invoice, InvoiceFormValues, ValidationErrorMap, ExtractedLineItem } from '@types';
import { formatIsoDate, parseApiToForm } from '@utils/invoiceUtils';
import {
  uploadInvoiceFile,
  getInvoices,
  getInvoice,
  updateInvoice as apiUpdateInvoice,
  submitInvoice as apiSubmitInvoice,
  approveInvoice as apiApproveInvoice,
  rejectInvoice as apiRejectInvoice,
  listPending,
  listApproved,
  getInvoiceStatistics
} from '@services/apiService';

export const uploadInvoiceFileThunk = createAsyncThunk(
  'invoices/uploadFile',
  async (
    args: { file: File; onProgress?: (p: number) => void },
    { rejectWithValue }
  ) => {
    try {
      const res = await uploadInvoiceFile(args.file, args.onProgress);
      if (!res.success || !res.data) return rejectWithValue(res.message || 'Upload failed');
      // API returns { data: { item: Invoice } }
      const item = (res.data as any).item;
      // Debug: log received item invoice_data and line_items
      try {
        console.debug('[uploadInvoiceFileThunk] item.invoice_data:', item?.invoice_data);
      } catch {}
      if (!item) return rejectWithValue('Invalid server response: missing item');
      return item as Invoice;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Upload failed');
    }
  }
);

export const listInvoicesThunk = createAsyncThunk('invoices/list', async (params: any, { rejectWithValue }) => {
  try {
    const res = await getInvoices(params);
    if (!res.success || !res.data) return rejectWithValue(res.message || 'Failed to load');
    return res.data.items;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
  }
});

export const fetchInvoiceThunk = createAsyncThunk('invoices/fetchOne', async (id: number, { rejectWithValue }) => {
  try {
    const res = await getInvoice(id);
    if (!res.success || !res.data) return rejectWithValue(res.message || 'Failed to load');
    return res.data;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
  }
});

export const updateInvoiceThunk = createAsyncThunk(
  'invoices/update',
  async (args: { id: number; payload: Partial<Invoice> }, { rejectWithValue }) => {
    try {
      const res = await apiUpdateInvoice(args.id, args.payload);
      if (!res.success || !res.data) return rejectWithValue(res.message || 'Update failed');
      const item = (res.data as any)?.item ?? res.data;
      return item as Invoice;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Update failed');
    }
  }
);

export const submitInvoiceThunk = createAsyncThunk('invoices/submit', async (id: number, { rejectWithValue }) => {
  console.log('submitInvoiceThunk called with id:', id);
  try {
    const res = await apiSubmitInvoice(id);
    console.log('submitInvoiceThunk API response:', res);
    if (!res.success || !res.data) return rejectWithValue(res.message || 'Submit failed');
    const item = (res.data as any)?.item ?? res.data;
    return item as Invoice;
  } catch (e: any) {
    console.error('submitInvoiceThunk error:', e);
    return rejectWithValue(e?.response?.data?.message || e?.message || 'Submit failed');
  }
});

export const approveInvoiceThunk = createAsyncThunk(
  'invoices/approve',
  async (args: { id: number; remarks?: string }, { rejectWithValue }) => {
    try {
      const res = await apiApproveInvoice(args.id, args.remarks);
      if (!res.success || !res.data) return rejectWithValue(res.message || 'Approve failed');
      const item = (res.data as any)?.item ?? res.data;
      return item as Invoice;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Approve failed');
    }
  }
);

export const rejectInvoiceThunk = createAsyncThunk(
  'invoices/reject',
  async (args: { id: number; remarks: string }, { rejectWithValue }) => {
    try {
      const res = await apiRejectInvoice(args.id, args.remarks);
      if (!res.success || !res.data) return rejectWithValue(res.message || 'Reject failed');
      const item = (res.data as any)?.item ?? res.data;
      return item as Invoice;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Reject failed');
    }
  }
);

export const listPendingThunk = createAsyncThunk('invoices/listPending', async (params: any, { rejectWithValue }) => {
  try {
    const res = await listPending(params);
    if (!res.success || !res.data) return rejectWithValue(res.message || 'Failed to load');
    return res.data.items;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
  }
});

export const listApprovedThunk = createAsyncThunk('invoices/listApproved', async (params: any, { rejectWithValue }) => {
  try {
    const res = await listApproved(params);
    if (!res.success || !res.data) return rejectWithValue(res.message || 'Failed to load');
    return res.data.items;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
  }
});

export const financeStatsThunk = createAsyncThunk('invoices/financeStats', async (_, { rejectWithValue }) => {
  try {
    const res = await getInvoiceStatistics();
    if (!res.success || !res.data) return rejectWithValue(res.message || 'Failed to load');
    return (res as any).data.stats ?? res.data; // prefer returning flat stats object
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || e?.message || 'Failed to load');
  }
});

type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

interface InvoiceState {
  items: Invoice[];
  current?: Invoice | null;
  formValues: InvoiceFormValues;
  validationErrors: ValidationErrorMap;
  extractedLineItems?: ExtractedLineItem[];
  selectedLineItemIndex: number | null;
  lineItemApplicationStatus: 'idle' | 'applying' | 'applied' | 'failed';
  uploadProgress: number;
  listStatus: LoadingState;
  saveStatus: LoadingState;
  submitStatus: LoadingState;
  error?: string | null;
  // Finance-specific
  pendingItems: Invoice[];
  approvedItems: Invoice[];
  pendingStatus: LoadingState;
  approvedStatus: LoadingState;
  approving: boolean;
  rejecting: boolean;
  financeStats?: any;
  statsStatus: LoadingState;
}

const initialState: InvoiceState = {
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
    setFormValues(state, action: PayloadAction<Partial<InvoiceFormValues>>) {
      state.formValues = { ...state.formValues, ...action.payload };
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = action.payload || 0;
    },
    setValidationErrors(state, action: PayloadAction<ValidationErrorMap>) {
      state.validationErrors = action.payload || {};
    },
    setSelectedLineItemIndex(state, action: PayloadAction<number | null>) {
      state.selectedLineItemIndex = typeof action.payload === 'number' ? action.payload : null;
    },
    clearSelectedLineItem(state) {
      state.selectedLineItemIndex = null;
    },
    setLineItemApplicationStatus(state, action: PayloadAction<'idle' | 'applying' | 'applied' | 'failed'>) {
      state.lineItemApplicationStatus = action.payload;
    },
    setExtractedLineItems(state, action: PayloadAction<ExtractedLineItem[]>) {
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
      .addCase(uploadInvoiceFileThunk.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.saveStatus = 'succeeded';
        state.current = action.payload;
        // Capture extracted line items if present
        const topLevel = action.payload?.line_items as any[] | undefined;
        const nested = (action.payload as any)?.invoice_data?.line_items as any[] | undefined;
        const raw: any[] = Array.isArray(topLevel) ? topLevel : (Array.isArray(nested) ? nested : []);
        const items: ExtractedLineItem[] = Array.isArray(raw)
          ? raw
              .filter((it) => it && typeof it === 'object')
              .map((it) => ({
                Line_Item: (it as any).Line_Item ?? (it as any).description ?? '',
                HSN_SAC: (it as any).HSN_SAC ?? (it as any).hsn_sac ?? '',
                gst_percent: (it as any).gst_percent,
                Basic_Amount: (it as any).Basic_Amount ?? (it as any).amount,
                IGST_Amount: (it as any).IGST_Amount ?? (it as any).igst_amount,
                CGST_Amount: (it as any).CGST_Amount ?? (it as any).cgst_amount,
                SGST_Amount: (it as any).SGST_Amount ?? (it as any).sgst_amount,
                Total_Amount: (it as any).Total_Amount
              }))
          : [];
        try {
          console.debug('[invoiceSlice] line_items (top-level):', topLevel);
          console.debug('[invoiceSlice] line_items (nested):', nested);
          console.debug('[invoiceSlice] extractedLineItems (final):', items);
        } catch {}
        state.extractedLineItems = Array.isArray(items) ? items : [];
        state.selectedLineItemIndex = null;
        state.lineItemApplicationStatus = 'idle';
        // Initialize form values with extracted data from invoice.invoice_data
        const d: any = (action.payload as any).invoice_data || {};
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
          remarks: (action.payload as any).approval_remarks || null
        } as any);
      })
      .addCase(uploadInvoiceFileThunk.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.error = (action.payload as string) || 'Upload failed';
      })
      .addCase(listInvoicesThunk.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(listInvoicesThunk.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.items = action.payload as Invoice[];
      })
      .addCase(listInvoicesThunk.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to load invoices';
      })
      .addCase(fetchInvoiceThunk.fulfilled, (state, action) => {
        state.current = action.payload as Invoice;
        const inv: any = action.payload as any;
        // Normalize extracted/selected line items for the editor
        const topLevel = inv?.line_items as any[] | undefined;
        const nested = inv?.invoice_data?.line_items as any[] | undefined;
        const raw: any[] = Array.isArray(topLevel) ? topLevel : (Array.isArray(nested) ? nested : []);
        const items: ExtractedLineItem[] = Array.isArray(raw)
          ? raw
              .filter((it) => it && typeof it === 'object')
              .map((it) => ({
                Line_Item: (it as any).Line_Item ?? (it as any).description ?? '',
                HSN_SAC: (it as any).HSN_SAC ?? (it as any).hsn_sac ?? '',
                gst_percent: (it as any).gst_percent,
                Basic_Amount: (it as any).Basic_Amount ?? (it as any).amount,
                IGST_Amount: (it as any).IGST_Amount ?? (it as any).igst_amount,
                CGST_Amount: (it as any).CGST_Amount ?? (it as any).cgst_amount,
                SGST_Amount: (it as any).SGST_Amount ?? (it as any).sgst_amount,
                Total_Amount: (it as any).Total_Amount
              }))
          : [];
        state.extractedLineItems = items;
        state.selectedLineItemIndex = null;
        state.lineItemApplicationStatus = 'idle';
        
        // Handle saved selected line items - if we have saved selections, use them as the source
        const savedSelectedItems = inv?.selected_line_items as any[] | undefined;
        if (Array.isArray(savedSelectedItems) && savedSelectedItems.length > 0) {
          // If we have saved selected items, use them as the extracted items
          // This ensures the component can properly match and preselect them
          state.extractedLineItems = savedSelectedItems.map((item: any) => ({
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
        const d: any = inv?.invoice_data || {};
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
        } as any);
      })
      .addCase(updateInvoiceThunk.pending, (state) => {
        state.saveStatus = 'loading';
        state.error = null;
      })
      .addCase(updateInvoiceThunk.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.current = action.payload as Invoice;
        state.items = state.items.map((it) => (it.id === (action.payload as Invoice).id ? (action.payload as Invoice) : it));
      })
      .addCase(updateInvoiceThunk.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.error = (action.payload as string) || 'Update failed';
      })
      .addCase(submitInvoiceThunk.pending, (state) => {
        state.submitStatus = 'loading';
        state.error = null;
      })
      .addCase(submitInvoiceThunk.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.current = action.payload as Invoice;
        state.items = state.items.map((it) => (it.id === (action.payload as Invoice).id ? (action.payload as Invoice) : it));
      })
      .addCase(submitInvoiceThunk.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.error = (action.payload as string) || 'Submit failed';
      })
      .addCase(approveInvoiceThunk.fulfilled, (state, action) => {
        state.approving = false;
        state.current = action.payload as Invoice;
        state.items = state.items.map((it) => (it.id === (action.payload as Invoice).id ? (action.payload as Invoice) : it));
        state.pendingItems = state.pendingItems.filter((it) => it.id !== (action.payload as Invoice).id);
        state.approvedItems = [action.payload as Invoice, ...state.approvedItems];
      })
      .addCase(approveInvoiceThunk.pending, (state) => {
        state.approving = true;
      })
      .addCase(approveInvoiceThunk.rejected, (state, action) => {
        state.approving = false;
        state.error = (action.payload as string) || 'Approve failed';
      })
      .addCase(rejectInvoiceThunk.fulfilled, (state, action) => {
        state.rejecting = false;
        state.current = action.payload as Invoice;
        state.items = state.items.map((it) => (it.id === (action.payload as Invoice).id ? (action.payload as Invoice) : it));
        state.pendingItems = state.pendingItems.filter((it) => it.id !== (action.payload as Invoice).id);
      })
      .addCase(rejectInvoiceThunk.pending, (state) => {
        state.rejecting = true;
      })
      .addCase(rejectInvoiceThunk.rejected, (state, action) => {
        state.rejecting = false;
        state.error = (action.payload as string) || 'Reject failed';
      })
      .addCase(listPendingThunk.pending, (state) => {
        state.pendingStatus = 'loading';
      })
      .addCase(listPendingThunk.fulfilled, (state, action) => {
        state.pendingStatus = 'succeeded';
        state.pendingItems = action.payload as Invoice[];
      })
      .addCase(listPendingThunk.rejected, (state, action) => {
        state.pendingStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to load pending';
      })
      .addCase(listApprovedThunk.pending, (state) => {
        state.approvedStatus = 'loading';
      })
      .addCase(listApprovedThunk.fulfilled, (state, action) => {
        state.approvedStatus = 'succeeded';
        state.approvedItems = action.payload as Invoice[];
      })
      .addCase(listApprovedThunk.rejected, (state, action) => {
        state.approvedStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to load approved';
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
        state.error = (action.payload as string) || 'Failed to load statistics';
      });
  }
});

export const { 
  setFormValues, 
  setValidationErrors, 
  clearCurrent,
  setSelectedLineItemIndex,
  clearSelectedLineItem,
  setLineItemApplicationStatus,
  setExtractedLineItems
} = invoicesSlice.actions;
export const { setUploadProgress } = invoicesSlice.actions as any;
export default invoicesSlice.reducer;


