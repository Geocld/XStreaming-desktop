import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useTranslation } from 'react-i18next';

const AuthModal = ({ show, onConfirm }) => {
  const { t } = useTranslation()

  const handleConfirm = () => {
    onConfirm && onConfirm();
  };

  return (
    <Modal isOpen={show} hideCloseButton={true}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">Warning</ModalHeader>
          <ModalBody>
            <p>{t('Login has expired or not logged in, please log in again')}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleConfirm}>
              Login
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default AuthModal;
