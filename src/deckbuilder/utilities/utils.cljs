(ns deckbuilder.utilities.utils (:require [clojure.set :as set]))

(defn first-missing-num
  "Given a list of integers, return the smallest positive integer not in the list."
  [xs]
  (let [potential-missing-nums (conj (set (map inc xs)) 1)
        missing-nums (set/difference potential-missing-nums (set xs))]
    (apply min missing-nums)))

(defn select-keys-by "Returns a map containing only those entries in map whose key has a value that satisfies a predicate"
  [m pred]
  (let [selected-keys (filter #(pred (second %)) m)]
    (select-keys m (map first selected-keys))))

(defn move-items "Transfers the first `amount` items from the first sequence to the second, returning the updated sequence."
  [from-seq to-seq amount]
  (let [items-to-move (take amount from-seq)]
    [(drop amount from-seq) (concat to-seq items-to-move)]))