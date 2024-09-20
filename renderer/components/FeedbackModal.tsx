import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import Image from "next/image";

const FeedbackModal = ({ show, onClose }) => {
  const { t } = useTranslation();

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
          <ModalHeader className="flex flex-col gap-1">反馈及支持</ModalHeader>
          <ModalBody>
            <p>
              如果你使用过程遇到任何问题或有更好的建议及想法，都可以加入XStreaming使用群进行交流。
            </p>
            <p>群号：958931336</p>
            {/* <p>
              <Image src="/images/feedback/QQ.jpg" alt="QQ" width={200} height={100} />
            </p> */}
            <p>
              XStreaming始终坚持开源免费，旨在为Xbox玩家串流玩家提供多一个串流选择，后续还会继续推出其他平台客户端，作者平时也喜欢玩游戏，也是使用业余时间开发软件，如果觉得XStreaming好用，不妨请作者喝杯咖啡，大家的支持就是持续开发维护的动力。
            </p>
            <div className="flex">
              <div className="w-1/3">
                <p>微信</p>
                <Image
                  src="/images/feedback/wechat.jpg"
                  alt="wechat"
                  width={100}
                  height={100}
                />
              </div>
              <div className="w-1/3">
                <p>支付宝</p>
                <Image
                  src="/images/feedback/alipay.jpg"
                  alt="alipay"
                  width={100}
                  height={100}
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
