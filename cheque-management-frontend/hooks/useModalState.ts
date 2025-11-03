import { useState } from 'react';

interface ModalState {
  isChequeModalOpen: boolean;
  isCashModalOpen: boolean;
}

export function useModalState(initialState: ModalState = {
  isChequeModalOpen: false,
  isCashModalOpen: false,
}) {
  const [modalState, setModalState] = useState<ModalState>(initialState);

  const openChequeModal = () => setModalState(prev => ({ ...prev, isChequeModalOpen: true }));
  const closeChequeModal = () => setModalState(prev => ({ ...prev, isChequeModalOpen: false }));
  const openCashModal = () => setModalState(prev => ({ ...prev, isCashModalOpen: true }));
  const closeCashModal = () => setModalState(prev => ({ ...prev, isCashModalOpen: false }));
  const closeAllModals = () => setModalState({ isChequeModalOpen: false, isCashModalOpen: false });

  return {
    modalState,
    setModalState,
    openChequeModal,
    closeChequeModal,
    openCashModal,
    closeCashModal,
    closeAllModals,
  };
}