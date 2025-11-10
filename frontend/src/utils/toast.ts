import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  toast(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    type,
    theme: 'colored',
  });
}
