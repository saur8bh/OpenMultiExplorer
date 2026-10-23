import asyncio
from typing import List, Dict, Any
from backend.accounts import account_manager
from backend.providers.base import StorageItem


class SearchEngine:
    """
    Unified Multi-Cloud Search Engine.
    Searches across multiple cloud accounts simultaneously.
    """

    async def search_account(
        self,
        account_id: str,
        query: str,
        start_path: str = "/",
        max_depth: int = 3,
        max_results: int = 50
    ) -> List[StorageItem]:
        query_lower = query.lower()
        results: List[StorageItem] = []
        provider = account_manager.get_provider(account_id)

        async def _crawl(current_path: str, depth: int):
            if depth > max_depth or len(results) >= max_results:
                return
            try:
                items = await provider.list_dir(current_path)
                for item in items:
                    if query_lower in item.name.lower():
                        results.append(item)
                        if len(results) >= max_results:
                            return
                    if item.is_dir and depth < max_depth:
                        await _crawl(item.path, depth + 1)
            except Exception:
                pass

        await _crawl(start_path, 1)
        return results

    async def search_all(
        self,
        query: str,
        account_ids: List[str] = None,
        max_results_per_account: int = 25
    ) -> List[Dict[str, Any]]:
        if not account_ids:
            account_ids = [acc["id"] for acc in account_manager.accounts]

        tasks = [
            self.search_account(acc_id, query, max_results=max_results_per_account)
            for acc_id in account_ids
        ]

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        aggregated: List[Dict[str, Any]] = []

        for acc_id, res in zip(account_ids, responses):
            if isinstance(res, list):
                for item in res:
                    item_dict = item.model_dump()
                    aggregated.append(item_dict)

        return aggregated


search_engine = SearchEngine()
