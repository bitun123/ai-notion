import { saveLink, uploadPdf, deleteLink } from '../api/contentApi';
import { useContentState } from '../state/ContentContext';

export const useManageContent = () => {
  const { setItems, setFilteredItems, setResurfacedItems } = useContentState();

  const handleSaveLink = async (url) => {
    try {
      await saveLink(url);
      return true;
    } catch (err) {
      console.error('Failed to save link:', err);
      return false;
    }
  };

  const handleUploadPdf = async (file) => {
    try {
      await uploadPdf(file);
      return true;
    } catch (err) {
      console.error('Failed to upload PDF:', err);
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLink(id);
      setItems(prev => prev.filter(item => item._id !== id));
      setFilteredItems(prev => prev.filter(item => item._id !== id));
      setResurfacedItems(prev => prev.filter(item => item._id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete link:', err);
      return false;
    }
  };

  return { handleSaveLink, handleUploadPdf, handleDelete };
};
