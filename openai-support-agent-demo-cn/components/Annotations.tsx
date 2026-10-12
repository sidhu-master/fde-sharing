export type Annotation = {
  type: "file_citation";
  fileId?: string;
  title?: string;
  filename?: string;
  index?: number;
};

const Annotations = ({ annotations }: { annotations: Annotation[] }) => {
  const uniqueAnnotations = annotations.reduce(
    (acc: Annotation[], annotation) => {
      if (
        !acc.some(
          (a: Annotation) =>
            a.type === annotation.type &&
            annotation.type === "file_citation" &&
            a.fileId === annotation.fileId
        )
      ) {
        acc.push(annotation);
      }
      return acc;
    },
    []
  );

  return (
    <div className="flex justify-end max-w-full overflow-x-scroll gap-2 ml-28 mr-4 mt-2 mb-2">
      {uniqueAnnotations.map((annotation: Annotation, index: number) => (
        <span
          key={index}
          className="inline-block text-nowrap px-3 py-1 rounded-full text-xs max-w-48 shrink-0 text-ellipsis overflow-hidden bg-[#ededed] text-zinc-500"
        >
          {annotation.filename}
        </span>
      ))}
    </div>
  );
};

export default Annotations;
