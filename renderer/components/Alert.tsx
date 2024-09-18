import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button} from "@nextui-org/react";

function Alert(props) {

  const handleConfirm = () => {
    props.onClose && props.onClose()
  }

  return (
    <Modal isOpen={true} scrollBehavior="inside" onClose={handleConfirm}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{ props.title || 'Warning' }</ModalHeader>
            <ModalBody className="scroll">
              { props.content }
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={handleConfirm}>
                Confirm
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default Alert
