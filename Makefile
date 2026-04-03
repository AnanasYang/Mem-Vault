# Memory System 2.0 Makefile

.PHONY: help daily weekly sync status review

help:
	@echo "Memory System 2.0 Commands:"
	@echo "  make daily    - Run daily L0→L1 transfer"
	@echo "  make weekly   - Run weekly review"
	@echo "  make sync     - Sync to GitHub"
	@echo "  make status   - Show system status"
	@echo "  make review   - Show pending reviews"

daily:
	@echo "🌅 Running daily dream..."
	node scripts/daily-dream-integrated.mjs
	node scripts/core/l1-to-l2.mjs
	make sync

weekly:
	@echo "📅 Running weekly review..."
	node scripts/weekly-dream-integrated.mjs
	make sync

sync:
	@echo "🔄 Syncing to GitHub..."
	./scripts/auto-sync.sh

status:
	@echo "📊 Memory System Status:"
	@echo "L1 Episodic: $$(find Memory/L1-episodic -name '*.md' 2>/dev/null | wc -l) files"
	@echo "L2 Procedural: $$(find Memory/L2-procedural -name '*.md' 2>/dev/null | wc -l) files"
	@echo "L3 Semantic: $$(find Memory/L3-semantic -name '*.md' 2>/dev/null | wc -l) files"
	@echo "L4 Core: $$(find Memory/L4-core -name '*.md' 2>/dev/null | wc -l) files"
	@echo ""
	@echo "Last sync: $$(cat .sync.log 2>/dev/null | tail -1 || echo 'N/A')"

review:
	@echo "📝 Pending Reviews:"
	@find Memory/L2-procedural -name '*.md' -exec grep -l 'review_status: pending' {} \; 2>/dev/null || echo "No pending reviews"
