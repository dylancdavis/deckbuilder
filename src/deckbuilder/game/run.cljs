(ns deckbuilder.game.run)

(def example-run
  {:resources {:points 0}
   :cards {:draw-pile [] :hand [] :discard-pile []}
   :deck-info {:cards [] :rules-card nil}
   :data {}
   :effects []
   :outcomes []})

(defn make-run [deck] {:resources {:points 0}
                       :cards {:draw-pile (:cards deck) :hand [] :discard-pile []}
                       :deck-info {:cards [] :rules-card (:rules-card deck)}
                       :data {:turn 1 :round 1}
                       :effects []
                       :outcomes []})

; TODO: Rewrite with update-in to avoid redeclaring other keys
(defn draw-cards
  ([cards n] (let [drawn-cards (take n (:draw-pile cards))]
               {:draw-pile (drop n (:draw-pile cards))
                :hand (into (:hand cards) drawn-cards)
                :discard-pile (:discard-pile cards)}))
  ([cards] (draw-cards cards 1)))

(defn advance-turn [run]
  (let [num-cards-to-draw (get-in run [:deck-info :rules-card :run-structure :draw-amount])
        new-cards (draw-cards (:cards run) num-cards-to-draw)]
    (assoc (update-in run [:data :turn] inc) :cards new-cards)))