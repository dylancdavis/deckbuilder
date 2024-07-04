(ns deckbuilder.utilities.count-map)

(defn inc-in-map
  ([map key n] (if (nil? (get map key)) (assoc map key n) (update-in map [key] #(+ % n))))
  ([map key] (inc-in-map map key 1)))

(defn dec-in-map
  ([map key n] (cond
                 (nil? (get map key)) map
                 (<= n (get map key)) (dissoc map key)
                 :else (update-in map [key] #(- % n))))
  ([map key] (dec-in-map map key 1)))

(defn merge-count-maps [m1 m2] (reduce (fn [acc [k v]] (inc-in-map acc k v)) m1 m2))

(defn to-seq [map] (mapcat (fn [[k v]] (repeat v k)) map))