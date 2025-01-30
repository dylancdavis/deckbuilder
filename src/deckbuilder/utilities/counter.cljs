(ns deckbuilder.utilities.counter)

(defn add "Adds `n` to the value of `key` in `map`. If `key` doesn't exist, it is added with value `n`."
  ([map key n] (if (nil? (get map key)) (assoc map key n) (update-in map [key] #(+ % n))))
  ([map key] (add map key 1)))

(defn sub "Subtracts `n` from the count of `key` in `map`. If the count reaches 0, the key is removed."
  ([map key n] (cond
                 (nil? (get map key)) map
                 (>= n (get map key)) (dissoc map key)
                 :else (update-in map [key] #(- % n))))
  ([map key] (sub map key 1)))

(defn total "Returns the total all count values in `map`."
  [map] (reduce + (vals map)))

(defn merge-counters [m1 m2]
  (reduce (fn [acc [k v]] (add acc k v)) m1 m2))

(defn select-keys-by "Returns a map containing only those entries in map whose key has a value that satisfies a predicate" [m pred]
  (let [selected-keys (filter #(pred (second %)) m)]
    (select-keys m (map first selected-keys))))

(defn missing-counts "Returns a counter tracking for each key the value within `m1` minus the value within `m2`, with non-positive values omitted."
  [m1 m2]
  (let [diffs (reduce (fn [acc [k v1]] (assoc acc k (- v1 (get m2 k 0)))) {} m1)
        positive-diffs (select-keys-by diffs pos?)]
    positive-diffs))

(defn as-list [map]
  (mapcat (fn [[k v]] (repeat v k)) map))

(defn as-shuffled-vector [c]
  (-> c as-list shuffle vec))