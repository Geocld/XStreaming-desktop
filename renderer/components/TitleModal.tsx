import { useEffect, useState, useRef } from "react";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, Chip} from "@nextui-org/react";


function TitleModal(props) {

  const titleItem = props.title || {}

  const handleClose = () => {
    console.log('handleClose')
    props.onClose && props.onClose()
  }

  const handleStartGame = () => {
    console.log('titleItem:', titleItem)
    // router.push('stream/' + sessionId)
  }

  return (
    <Modal isOpen={true} size="full" scrollBehavior="inside" onClose={handleClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{ titleItem.ProductTitle }</ModalHeader>
            <ModalBody className="scroll">
              <div className="flex">
                <div className="w-1/3">
                  <Image
                    className="object-cover rounded-xl"
                    isZoomed
                    src={titleItem.Image_Poster.URL}
                  />
                </div>

                <div className="w-2/3 pl-5">
                  <p>{ titleItem.PublisherName }</p>
                  <p>{ titleItem.ProductDescription || '' }</p>
                  <div className="pt-5 flex gap-4">
                    {
                      titleItem.Categories.map((item, idx) => {
                        return (
                          <Chip key={idx} color="success" variant="bordered">{ item }</Chip>
                        )
                      })
                    }
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Close
              </Button>
              <Button color="primary" onPress={handleStartGame}>
                Start Game
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export default TitleModal
