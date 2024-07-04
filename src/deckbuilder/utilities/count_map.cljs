(ns deckbuilder.utilities.count-map)

(defn inc-in-map [map key] (if (nil? (get map key)) (assoc map key 1) (update-in map [key] inc)))

(defn dec-in-map [map key]
  (cond
    (nil? (get map key)) map
    (= 1 (get map key)) (dissoc map key)
    :else (update-in map [key] dec)))