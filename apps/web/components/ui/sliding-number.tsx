"use client";

import * as React from "react";
import {
  useSpring,
  useTransform,
  motion,
  useInView,
  type MotionValue,
  type SpringOptions,
  type UseInViewOptions,
} from "motion/react";
import useMeasure from "react-use-measure";
import { cn } from "@/lib/utils";

type SlidingNumberRollerProps = {
  prevValue: number;
  value: number;
  place: number;
  transition: SpringOptions;
};

function SlidingNumberRoller({
  prevValue,
  value,
  place,
  transition,
}: SlidingNumberRollerProps) {
  const startNumber = Math.floor(prevValue / place) % 10;
  const targetNumber = Math.floor(value / place) % 10;
  const animatedValue = useSpring(startNumber, transition);

  React.useEffect(() => {
    animatedValue.set(targetNumber);
  }, [targetNumber, animatedValue]);

  const [measureRef, { height }] = useMeasure();

  return (
    <span
      ref={measureRef}
      data-slot="sliding-number-roller"
      className="relative inline-block w-[1ch] overflow-x-visible overflow-y-clip leading-none tabular-nums"
    >
      <span className="invisible">0</span>
      {Array.from({ length: 10 }, (_, i) => (
        <SlidingNumberDisplay
          key={i}
          motionValue={animatedValue}
          number={i}
          height={height}
          transition={transition}
        />
      ))}
    </span>
  );
}

type SlidingNumberDisplayProps = {
  motionValue: MotionValue<number>;
  number: number;
  height: number;
  transition: SpringOptions;
};

function SlidingNumberDisplay({
  motionValue,
  number,
  height,
  transition,
}: SlidingNumberDisplayProps) {
  const y = useTransform(motionValue, (latest) => {
    if (!height) return 0;
    const currentNumber = Math.round(latest) % 10;
    const offset = (10 + number - currentNumber) % 10;
    let translateY = offset * height;
    // Use sliding window: if offset is more than half the range, go the other way
    if (offset > 5) translateY -= 10 * height;
    return translateY;
  });

  if (!height) {
    return <span className="invisible absolute">{number}</span>;
  }

  return (
    <motion.span
      data-slot="sliding-number-display"
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
      transition={{ ...transition, type: "spring" }}
    >
      {number}
    </motion.span>
  );
}

type SlidingNumberProps = React.ComponentProps<"span"> & {
  number: number | string;
  setNumber?: (value: number) => void;
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  inViewOnce?: boolean;
  padStart?: boolean;
  decimalSeparator?: string;
  decimalPlaces?: number;
  transition?: SpringOptions;
};

function SlidingNumber({
  ref,
  number,
  setNumber,
  className,
  inView = false,
  inViewMargin = "0px",
  inViewOnce = true,
  padStart = false,
  decimalSeparator = ".",
  decimalPlaces = 0,
  transition = {
    stiffness: 200,
    damping: 20,
    mass: 0.4,
  },
  ...props
}: SlidingNumberProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");

  React.useImperativeHandle(ref, () => localRef.current!);

  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;

  const prevNumberRef = React.useRef<number>(0);

  const effectiveNumber = React.useMemo(
    () => (!isInView ? 0 : Math.abs(Number(number))),
    [number, isInView]
  );

  const formatNumber = React.useCallback(
    (num: number) =>
      decimalPlaces != null ? num.toFixed(decimalPlaces) : num.toString(),
    [decimalPlaces]
  );

  const numberStr = formatNumber(effectiveNumber);
  const [newIntStrRaw, newDecStrRaw = ""] = numberStr.split(".");
  const newIntStr =
    padStart && newIntStrRaw?.length === 1 ? "0" + newIntStrRaw : newIntStrRaw;

  const prevFormatted = formatNumber(prevNumberRef.current);
  const [prevIntStrRaw = "", prevDecStrRaw = ""] = prevFormatted.split(".");
  const prevIntStr =
    padStart && prevIntStrRaw.length === 1
      ? "0" + prevIntStrRaw
      : prevIntStrRaw;

  const adjustedPrevInt = React.useMemo(() => {
    return prevIntStr.length > (newIntStr?.length ?? 0)
      ? prevIntStr.slice(-(newIntStr?.length ?? 0))
      : prevIntStr.padStart(newIntStr?.length ?? 0, "0");
  }, [prevIntStr, newIntStr]);

  const adjustedPrevDec = React.useMemo(() => {
    if (!newDecStrRaw) return "";
    return prevDecStrRaw.length > newDecStrRaw.length
      ? prevDecStrRaw.slice(0, newDecStrRaw.length)
      : prevDecStrRaw.padEnd(newDecStrRaw.length, "0");
  }, [prevDecStrRaw, newDecStrRaw]);

  React.useEffect(() => {
    if (isInView) prevNumberRef.current = effectiveNumber;
  }, [effectiveNumber, isInView]);

  const handleDoubleClick = React.useCallback(() => {
    if (setNumber) {
      setIsEditing(true);
      setEditValue(effectiveNumber.toString());
    }
  }, [setNumber, effectiveNumber]);

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setEditValue(value);
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && setNumber) {
        setNumber(numValue);
      }
    },
    [setNumber]
  );

  const handleInputBlur = React.useCallback(() => {
    setIsEditing(false);
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && setNumber) {
      setNumber(numValue);
    }
  }, [editValue, setNumber]);

  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsEditing(false);
        const numValue = parseFloat(editValue);
        if (!isNaN(numValue) && setNumber) {
          setNumber(numValue);
        }
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(effectiveNumber.toString());
      }
    },
    [editValue, setNumber, effectiveNumber]
  );

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      if (!setNumber) return;
      e.preventDefault();
      const startX = e.clientX;
      const startValue = effectiveNumber;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const sensitivity = 0.5;
        const newValue = Math.max(0, startValue + deltaX * sensitivity);
        setEditValue(newValue.toFixed(decimalPlaces));
        setNumber(newValue);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [setNumber, effectiveNumber, decimalPlaces]
  );

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const intDigitCount = newIntStr?.length ?? 0;
  const intPlaces = React.useMemo(
    () =>
      Array.from({ length: intDigitCount }, (_, i) =>
        Math.pow(10, intDigitCount - i - 1)
      ),
    [intDigitCount]
  );
  const decPlaces = React.useMemo(
    () =>
      newDecStrRaw
        ? Array.from({ length: newDecStrRaw.length }, (_, i) =>
            Math.pow(10, newDecStrRaw.length - i - 1)
          )
        : [],
    [newDecStrRaw]
  );

  const newDecValue = newDecStrRaw ? parseInt(newDecStrRaw, 10) : 0;
  const prevDecValue = adjustedPrevDec ? parseInt(adjustedPrevDec, 10) : 0;

  if (isEditing && setNumber) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        onMouseDown={handleMouseDown}
        className={cn(
          "bg-transparent outline-none border-none cursor-ew-resize",
          "text-inherit font-inherit",
          "focus:ring-0 focus-visible:ring-0 focus:outline-none",
          "appearance-none [-moz-appearance:textfield]",
          "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          "text-3xl!", // or !text-4xl for even larger
          className
        )}
        style={{ width: "auto", minWidth: "1ch" }}
      />
    );
  }

  return (
    <span
      ref={localRef}
      data-slot="sliding-number"
      className={cn(
        "flex items-center",
        setNumber && "cursor-pointer",
        className
      )}
      onDoubleClick={handleDoubleClick}
      {...props}
    >
      {isInView && Number(number) < 0 && <span className="mr-1">-</span>}

      {intPlaces.map((place) => (
        <SlidingNumberRoller
          key={`int-${place}`}
          prevValue={parseInt(adjustedPrevInt, 10)}
          value={parseInt(newIntStr ?? "0", 10)}
          place={place}
          transition={transition}
        />
      ))}

      {newDecStrRaw && (
        <>
          <span>{decimalSeparator}</span>
          {decPlaces.map((place) => (
            <SlidingNumberRoller
              key={`dec-${place}`}
              prevValue={prevDecValue}
              value={newDecValue}
              place={place}
              transition={transition}
            />
          ))}
        </>
      )}
    </span>
  );
}

export { SlidingNumber, type SlidingNumberProps };
