(ns deckbuilder.utilities.collection (:require [deckbuilder.utilities.utils :refer [first-missing-num]]))

(defn new-deck-name [deck-names]
  (let [new-deck-numbers (->> deck-names
                              (map #(re-find #"New Deck (\d+)" %))
                              (filter identity) ; Removes nil entries
                              (map #(js/parseInt (second %)))) ; extract deck numbers from names
        next-number (if (empty? new-deck-numbers) 1 (first-missing-num new-deck-numbers))]
    (str "New Deck " next-number)))