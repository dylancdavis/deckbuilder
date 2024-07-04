(ns deckbuilder.game.round
  (:require
   [re-frame.core :as re-frame]))

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