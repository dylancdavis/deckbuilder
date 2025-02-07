(ns deckbuilder.game.run-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.game.run :refer [move-cards populate-draw-pile process-start-of-game draw-first-hand]]))

(def base-rules {:name "Example Rules"
                 :type :rules
                 :deck-limits {:size [0,0]}
                 :turn-structure {:draw-amount 1
                                  :play-amount 1}
                 :end-conditions {:rounds 1}
                 :effects nil
                 :cost 2})

(def rules-with-added-cards {:name "Example Rules"
                             :type :rules
                             :deck-limits {:size [0,0]}
                             :turn-structure {:draw-amount 1
                                              :play-amount 1}
                             :end-conditions {:rounds 1}
                             :effects {:game-start [[:add-cards :draw-pile {:foo 2 :bar 2}]]}
                             :cost 2})

(def pre-move-run {:cards {:draw-pile [:a :b :c :d :e] :hand [:f :g :h :i] :discard-pile []}})

(def post-move-run {:cards {:draw-pile [:d :e] :hand [:f :g :h :i :a :b :c] :discard-pile []}})
(deftest move-cards-test
  (is (= post-move-run (move-cards pre-move-run :draw-pile :hand 3)) "Should move 3 cards from draw-pile to hand"))

(def example-counter {:a 3 :b 2 :c 1})

(def empty-hand-run
  {:resources {:points 0}
   :cards {:draw-pile [] :hand [] :discard-pile []}
   :deck-info {:cards example-counter :rules-card rules-with-added-cards}
   :data {}
   :effects []
   :outcomes []})

(deftest populate-draw-pile-test
  (is (= example-counter (-> empty-hand-run populate-draw-pile :cards :draw-pile frequencies))
      "Should add cards to draw-pile from deck"))

(def populated-hand-run
  {:resources {:points 0}
   :cards {:draw-pile [:a :a :a :b :b :c] :hand [] :discard-pile []}
   :deck-info {:cards example-counter :rules-card rules-with-added-cards}
   :data {}
   :effects []
   :outcomes []})

(def populated-hand-run-no-added
  {:resources {:points 0}
   :cards {:draw-pile [:a :a :a :b :b :c] :hand [] :discard-pile []}
   :deck-info {:cards example-counter :rules-card base-rules}
   :data {}
   :effects []
   :outcomes []})

(deftest process-start-of-game-test
  (is (=
       (-> populated-hand-run-no-added process-start-of-game :cards :draw-pile)
       (get-in populated-hand-run-no-added [:cards :draw-pile]))
      "Shouldn't modify cards in draw-pile when no cards are added")
  (is (=
       (-> populated-hand-run process-start-of-game :cards :draw-pile frequencies)
       {:a 3 :b 2 :c 1 :foo 2 :bar 2})
      "Should add cards to draw-pile from rules card")
  (is (=
       (filter #(not (or (= % :foo) (= % :bar))) (-> populated-hand-run process-start-of-game :cards :draw-pile))
       (get-in populated-hand-run [:cards :draw-pile]))
      "Should preserve original draw order when cards are added"))
