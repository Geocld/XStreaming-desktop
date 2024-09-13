import { useEffect, useState, useRef } from "react";
import {
  Card, 
  CardBody, 
  CardFooter,
  Image,
} from "@nextui-org/react";

function TitleItem(props) {
  const titleItem = props.title || {name: '123'}

  const handleClick = () => {
    props.onClick && props.onClick(titleItem)
  }
  return (
    <>
      {
        titleItem ? (
          <Card className="mb-5" shadow="sm" isPressable onClick={handleClick}>
            <CardBody className="overflow-visible py-2">
              <Image
                alt="Card background"
                className="object-cover rounded-xl"
                src={'https:' + titleItem.Image_Tile.URL}
                width={270}
              />
            </CardBody>
            <CardFooter className="pt-0 px-4 flex-col items-start">
              <h4 className="font-bold">{ titleItem.ProductTitle }</h4>
            </CardFooter>
          </Card>
        ) : null
      }
    </>
  );
}

export default TitleItem;
