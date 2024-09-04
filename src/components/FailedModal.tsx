import React from 'react'
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from "@nextui-org/react"
import { useTranslation } from 'react-i18next';

const FailedModal = ({ show, onConfirm, onCancel }) => {
  const { t } = useTranslation()

  const handleRefresh = () => {
    onConfirm && onConfirm()
  }

  const handleExit = () => {
    onCancel && onCancel()
  }
  return (
    <Modal isOpen={show} hideCloseButton={true}>
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">{t('Warning')}</ModalHeader>
          <ModalBody>
            <p>{t('NAT traversal failed. If you were attempting remote streaming and it was successful before, please click the refresh button below to refresh the streaming credentials and try again.')}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleExit}>
              {t('Exit')}
            </Button>
            <Button color="primary" onPress={handleRefresh}>
              {t('Refresh')}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  )
}

export default FailedModal
