(ns deckbuilder.game.round
  (:gen-class)
  (:require [deckbuilder.game.cards :as cards]))

(def resources {:energy {:display "Energy" :value 0}
                :credits {:display "Credits" :value 0}})

(defn discard-hand [deck]
  (if (:hand deck)
    (assoc deck :discard-pile (cons (:hand deck) (:discard-pile deck)) :hand nil)
    deck))

(defn draw-card [deck]
  (if (empty? (:draw-pile deck))
    deck
    (assoc deck
           :draw-pile (rest (:draw-pile deck))
           :hand (first (:draw-pile deck)))))

(defn advance-deck [deck]
  (draw-card (discard-hand deck)))

(defn play-deck
  ([term deck]
   (if (and (empty? (:draw-pile deck)) (nil? (:hand deck)))
     deck
     (play-deck term (advance-deck deck))))
  ([term] (play-deck term cards/starting-deck)))