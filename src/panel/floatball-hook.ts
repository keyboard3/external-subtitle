import { FloatButtonElement } from "antd/es/float-button/interface";
import React, { Dispatch, SetStateAction, useCallback, useEffect } from "react";

export function useFloatingBall(props: {
  setConfig: Dispatch<SetStateAction<Partial<Config>>>;
  onClick: () => void;
}) {
  const { onClick, setConfig } = props;

  const dragRef = React.useRef<{
    down: boolean;
    move: boolean;
  }>({ down: false, move: false });
  const ballRef = React.useRef<FloatButtonElement>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    const ballWidth = ballRef.current!.offsetWidth;
    const ballHeight = ballRef.current!.offsetHeight;
    const newTop = clientY - ballHeight / 2;
    // const newRight = innerWidth - clientX - ballWidth / 2;
    ballRef.current!.style.top = `${newTop}px`;
    // ballRef.current!.style.right = `${newRight}px`;
    dragRef.current.move = true;
  }, []);

  const handleMouseUp = useCallback((event: Event) => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    if (!dragRef.current.move && dragRef.current.down) {
      onClick();
    }
    if (dragRef.current.move) {
      if (ballRef.current!.style.top) {
        // setConfig({
        //   floatball: {
        //     enable: true,
        //     top: ballRef.current!.style.top,
        //     right: ballRef.current!.style.right,
        //   },
        // });
      }
      onClick();
    }
    dragRef.current.down = false;
    dragRef.current.move = false;
  }, [onClick]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<FloatButtonElement>) => {
      dragRef.current.down = true;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [],
  );

  return {
    ballRef,
    handleMouseDown,
  };
}
