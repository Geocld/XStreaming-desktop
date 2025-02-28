import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useTranslation } from "next-i18next";
import Image from "next/image";

const FeedbackModal = ({ show, onClose }) => {
  const { t } = useTranslation('common');

  const handleClose = () => {
    onClose && onClose();
  };
  return (
    <Modal
      size="full"
      scrollBehavior="inside"
      isOpen={show}
      hideCloseButton={true}
    >
      <ModalContent>
        <>
          <ModalHeader className="flex flex-col gap-1">交流</ModalHeader>
          <ModalBody>
            <p>
              喜欢折腾、主机串流、云游戏及串流技术开发，欢迎加入群聊。
            </p>
            <p>群号：964721224</p>
            <p>
              XStreaming始终坚持开源免费，旨在为Xbox玩家串流玩家提供多一个串流选择，后续还会继续推出其他平台客户端，作者平时也喜欢玩游戏，也是使用业余时间开发软件，如果觉得XStreaming好用，不妨请作者喝杯咖啡，大家的支持就是持续开发维护的动力。
            </p>
            <div className="flex">
              <div className="w-1/3">
                <Image
                  src="/images/feedback/wx_sponsor.png"
                  alt="wechat"
                  width={300}
                  height={300}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleClose}>
              {t("Close")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
