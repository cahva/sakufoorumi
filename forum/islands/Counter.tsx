import { useState } from "preact/hooks";
import { Button } from "../components/Button.tsx";
import { signal } from "@preact/signals";

const count = signal(0);

interface CounterProps {
  start: number;
}

export default function Counter(props: CounterProps) {
  // const [count, setCount] = useState(props.start);
  count.value = props.start;

  const increment = () => {
    count.value += 1;
  };

  const decrement = () => {
    count.value -= 1;
  };

  return (
    <div class="flex gap-2 w-full">
      <p class="flex-grow-1 font-bold text-xl">{count}</p>
      <Button onClick={decrement}>-1</Button>
      <Button onClick={increment}>+1</Button>
    </div>
  );
}
