(ns deckbuilder.game.round
  (:require [deckbuilder.game.cards :as cards]
            [re-frame.core :as re-frame]))

(def starting-resources {:energy {:display "Energy" :value 0}
                         :credits {:display "Credits" :value 0}})

(defn cardlist-from-cardmap [cardmap]
  (mapcat (fn [[card count]] (repeat count card)) cardmap))

(defn starting-round-data-from-deck [deck] (let [cards (:cards deck)] {:draw-pile (shuffle (cardlist-from-cardmap cards))}))

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