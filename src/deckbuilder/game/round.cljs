(ns deckbuilder.game.round
  (:require [deckbuilder.game.cards :as cards]
            [re-frame.core :as re-frame]))

(def starting-resources {:points {:display "Points" :value 0}})

(defn cardlist-from-cardmap [cardmap]
  (mapcat (fn [[card count]] (repeat count card)) cardmap))

(defn starting-round-data-from-deck [deck]
  (let
   [deck-cardmap (:cards deck)
    added-cardmap (get-in deck [:rules-card :deck-limits :added-cards])]
    {:draw-pile (shuffle (concat
                          (cardlist-from-cardmap deck-cardmap)
                          (cardlist-from-cardmap added-cardmap)))
     :rules-card (:rules-card deck)}))

(defn play-hand [deck]
  (if (:hand deck)
    (do (re-frame.core/dispatch (:event (:hand deck)))
        (assoc deck :discard-pile (cons (:hand deck) (:discard-pile deck)) :hand nil))
    deck))

(defn draw-card [deck]
  (if (empty? (:draw-pile deck))
    deck
    (assoc deck
           :draw-pile (rest (:draw-pile deck))
           :hand (first (:draw-pile deck)))))

(defn advance-deck [deck]
  (draw-card (play-hand deck)))

(defn play-deck
  ([term deck]
   (if (and (empty? (:draw-pile deck)) (nil? (:hand deck)))
     deck
     (play-deck term (advance-deck deck))))
  ([term] (play-deck term cards/starting-round)))