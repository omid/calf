import React from "react";
import type { ReactNode } from "react";
import { Accordion, AccordionItem } from "@heroui/react";

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  startContent?: ReactNode;
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  startContent,
}) => {
  return (
    <Accordion variant="bordered">
      <AccordionItem startContent={startContent} title={title}>
        {children}
      </AccordionItem>
    </Accordion>
  );
};

export default CollapsibleSection;
