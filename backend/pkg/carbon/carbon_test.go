package carbon

import "testing"

func TestCalculate_MassTimesEF(t *testing.T) {
	w, fp, av := Calculate(2, 0.5, nil, 3.0, ptr(1.0))
	if w != 1.0 {
		t.Fatalf("weight=%v want 1", w)
	}
	if fp != 3.0 {
		t.Fatalf("footprint=%v want 3", fp)
	}
	if av != 2.0 {
		t.Fatalf("avoided=%v want 2", av)
	}
}

func TestCalculate_ActualWeightOverride(t *testing.T) {
	actual := 0.25
	w, fp, _ := Calculate(10, 0.5, &actual, 2.0, nil)
	if w != 0.25 {
		t.Fatalf("weight=%v want 0.25", w)
	}
	if fp != 0.5 {
		t.Fatalf("footprint=%v want 0.5", fp)
	}
}

func ptr(v float64) *float64 { return &v }
