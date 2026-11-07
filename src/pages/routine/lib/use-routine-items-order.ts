"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  ROUTINE_ORDER_MAX_RETRIES,
  ROUTINE_ORDER_RETRY_BASE_DELAY_MS,
  ROUTINE_ORDER_SAVE_DELAY_MS,
  type TRoutineItem,
} from "@/entities/routine";
import { setRoutineItemsOrder } from "../api/set-routine-items-order";

/**
 * Оптимистичный порядок позиций рутины: стрелки меняют его мгновенно, а в БД
 * он уезжает после ROUTINE_ORDER_SAVE_DELAY_MS бездействия, при уходе со
 * страницы или при уходе вкладки в фон.
 *
 * `flushOnExit` у дебаунса закрывает unmount (переходы по приложению) и
 * visibilitychange; pagehide добавлен для перезагрузки/закрытия вкладки.
 * Delivery при выгрузке страницы best-effort: серверный экшен — обычный
 * асинхронный fetch, а keepalive для него недоступен.
 */
export const useRoutineItemsOrder = ({
  routineId,
  items,
  onSaved,
}: {
  routineId: string;
  items: TRoutineItem[];
  onSaved: () => void;
}) => {
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedItems = useMemo(() => {
    if (!orderedIds) {
      return items;
    }

    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    // позиции, добавленные уже после перестановки, остаются в конце списка
    const tail = orderedIds.length;

    return [...items].sort(
      (left, right) =>
        (rank.get(left.id) ?? tail) - (rank.get(right.id) ?? tail),
    );
  }, [items, orderedIds]);

  // Рефы дублируют isStale и ids: flush дебаунса может сработать до
  // ре-рендера (pagehide сразу после клика), и persist обязан видеть свежие
  // значения, а не состояние из последнего рендера.
  const isStaleRef = useRef(false);
  const idsRef = useRef(orderedItems.map((item) => item.id));

  // Бюджет автоповторов после сбоя и таймер ближайшей попытки. Рефы, а не
  // состояние: повтор назначается из асинхронного persist и должен видеть
  // свежие значения без лишнего ре-рендера.
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStale = (value: boolean) => {
    isStaleRef.current = value;
    setIsStale(value);
  };

  const clearRetryTimer = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // объявлен до дебаунса: его cleanup отрабатывает раньше flush при unmount,
  // поэтому сохранение «на выходе» не дёргает refresh уже размонтированной страницы
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // отложенный повтор не должен пережить страницу и дёрнуть setState/refresh
      clearRetryTimer();
    };
  }, []);

  useEffect(() => {
    idsRef.current = orderedItems.map((item) => item.id);
  }, [orderedItems]);

  const persist = async () => {
    if (!isStaleRef.current) {
      return;
    }

    setStale(false);

    // сетевой сбой или 500 — это reject, а не текст ошибки: без catch порядок
    // остался бы помеченным сохранённым и потерялся бы
    let message: string | null;

    try {
      message = await setRoutineItemsOrder(routineId, idsRef.current);
    } catch {
      message = "Не удалось сохранить порядок";
    }

    if (message) {
      setStale(true);
      setError(message);

      // Сбой сам по себе не пройдёт: назначаем ограниченные повторы с растущей
      // паузой. Когда бюджет исчерпан, останавливаемся — дальше пользователь
      // жмёт «Повторить» (retry), а не ждёт чуда от восстановления сети.
      if (
        isMountedRef.current &&
        retryCountRef.current < ROUTINE_ORDER_MAX_RETRIES
      ) {
        const delay =
          ROUTINE_ORDER_RETRY_BASE_DELAY_MS * 2 ** retryCountRef.current;

        retryCountRef.current += 1;
        clearRetryTimer();
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          void persist();
        }, delay);
      }

      return;
    }

    retryCountRef.current = 0;
    clearRetryTimer();
    setError(null);

    if (isMountedRef.current) {
      onSaved();
    }
  };

  const schedulePersist = useDebouncedCallback(
    () => void persist(),
    ROUTINE_ORDER_SAVE_DELAY_MS,
    { trailing: true, flushOnExit: true },
  );

  useEffect(() => {
    const handlePageHide = () => schedulePersist.flush();

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [schedulePersist]);

  const move = (index: number, direction: -1 | 1) => {
    const ids = orderedItems.map((item) => item.id);
    const target = index + direction;

    if (target < 0 || target >= ids.length) {
      return;
    }

    [ids[index], ids[target]] = [ids[target], ids[index]];

    // Новая перестановка отменяет ожидающий повтор прошлой пачки и обнуляет
    // бюджет: актуальный порядок уедет обычным дебаунсом.
    clearRetryTimer();
    retryCountRef.current = 0;

    idsRef.current = ids;
    setStale(true);
    setError(null);
    setOrderedIds(ids);
    schedulePersist();
  };

  // Явный повтор после сбоя: сбрасывает бюджет и пробует сразу, не дожидаясь
  // ближайшего автоповтора. Доступен, когда автоповторы исчерпаны (или чтобы не
  // ждать их). stale-флаг гарантирует, что сохраняем именно несохранённый порядок.
  const retry = () => {
    clearRetryTimer();
    retryCountRef.current = 0;
    void persist();
  };

  return { orderedItems, isStale, error, move, retry };
};
