import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@hooks/index';
import { uploadInvoiceFileThunk, listInvoicesThunk, updateInvoiceThunk, submitInvoiceThunk, approveInvoiceThunk, rejectInvoiceThunk, setFormValues, setValidationErrors, clearCurrent } from '@store/invoiceSlice';
import { validateInvoice } from '@utils/invoiceValidation';
import { parseFormToApi } from '@utils/invoiceUtils';
export function useInvoiceUpload() {
    const dispatch = useAppDispatch();
    const saveStatus = useAppSelector((s) => s.invoices.saveStatus);
    const upload = useCallback(async (file, onProgress) => {
        return await dispatch(uploadInvoiceFileThunk({ file, onProgress }));
    }, [dispatch]);
    return { upload, saveStatus };
}
export function useInvoiceList() {
    const dispatch = useAppDispatch();
    const items = useAppSelector((s) => s.invoices.items);
    const listStatus = useAppSelector((s) => s.invoices.listStatus);
    const load = useCallback(async (params) => dispatch(listInvoicesThunk(params)), [dispatch]);
    return { items, listStatus, load };
}
export function useInvoiceForm() {
    const dispatch = useAppDispatch();
    const current = useAppSelector((s) => s.invoices.current);
    const values = useAppSelector((s) => s.invoices.formValues);
    const errors = useAppSelector((s) => s.invoices.validationErrors);
    const saveStatus = useAppSelector((s) => s.invoices.saveStatus);
    const submitStatus = useAppSelector((s) => s.invoices.submitStatus);
    const setValues = useCallback((v) => dispatch(setFormValues(v)), [dispatch]);
    const validate = useCallback(() => dispatch(setValidationErrors(validateInvoice(values))), [dispatch, values]);
    const save = useCallback(async () => {
        if (!current)
            return;
        const errs = validateInvoice(values);
        dispatch(setValidationErrors(errs));
        if (Object.keys(errs).length)
            return false;
        const result = await dispatch(updateInvoiceThunk({ id: current.id, payload: parseFormToApi({ ...values }) }));
        return updateInvoiceThunk.fulfilled.match(result);
    }, [dispatch, current, values]);
    const submit = useCallback(async () => {
        if (!current)
            return;
        const ok = await save();
        if (ok) {
            await dispatch(submitInvoiceThunk(current.id));
        }
    }, [dispatch, save, current]);
    const reset = useCallback(() => dispatch(clearCurrent()), [dispatch]);
    return { current, values, errors, setValues, validate, save, submit, saveStatus, submitStatus, reset };
}
export function useInvoiceWorkflow() {
    const dispatch = useAppDispatch();
    const approve = useCallback((id, remarks) => dispatch(approveInvoiceThunk({ id, remarks })), [dispatch]);
    const reject = useCallback((id, remarks) => dispatch(rejectInvoiceThunk({ id, remarks })), [dispatch]);
    return { approve, reject };
}
